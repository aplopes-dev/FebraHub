import { Injectable, Logger } from '@nestjs/common';
import {
  StatusProbe,
  type ProbeInput,
  type ProbeResult,
} from '../domain/status-probe';
import { mapCstatToStatus } from '../domain/cstat-mapping';
import type { Authority } from '../domain/service-status';
import { CertificateRepository } from '../../certificates/domain/repositories/certificate.repository.interface';
import { CompanyRepository } from '../../companies/domain/repositories/company.repository.interface';
import { ObjectStorage } from '../../../shared/domain/storage/object-storage.interface';
import { loadCertificateKeyMaterial } from '../../../shared/infra/fiscal-signature/certificate-key-loader';
import { callSefazSoapOperation } from '../../../shared/infra/fiscal-soap/sefaz-soap-client';
import { SefazCaBundleNotFoundError } from '../../../shared/infra/fiscal-soap/errors/sefaz-ca-bundle-not-found.error';
import {
  resolveSefazBaEndpoint,
  type SefazFiscalModel,
} from '../../providers/sefaz-ba/infrastructure/sefaz-ba-config';
import {
  buildConsStatServXml,
  parseRetConsStatServXml,
} from '../../providers/sefaz-ba/infrastructure/nfe-soap-envelope';

const STATUS_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4';

/// Tempo limite por órgão (R5). Curto de propósito: a consulta inteira tem 5s
/// (SC-003), e os órgãos são contatados em paralelo — cada um cabe em ~4s.
const PROBE_TIMEOUT_MS = 4_000;

/// Sonda a disponibilidade da SEFAZ para NF-e (modelo 55, SEFAZ-BA) e NFC-e
/// (modelo 65, SVRS) — mesma operação `NFeStatusServico4`, órgão roteado por
/// modelo (spec fiscal/001 R1).
///
/// ⚠️ **Não lança por indisponibilidade** (contrato de `StatusProbe`): falha de
/// transporte/timeout vira `UNREACHABLE`, para não derrubar a consulta paralela
/// dos outros modelos (FR-008a). Certificado ausente/vencido vira `LOCAL_ERROR`
/// **sem** contatar o órgão (FR-010).
@Injectable()
export class SefazBaStatusProbe extends StatusProbe {
  private readonly logger = new Logger(SefazBaStatusProbe.name);

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly objectStorage: ObjectStorage,
  ) {
    super();
  }

  /// Recusa PRODUCTION não configurado antes de qualquer contato (FR-009):
  /// `resolveSefazBaEndpoint` lança `SefazEnvironmentNotConfiguredError`
  /// (nome contém `NotConfigured` → 424).
  override assertEnvironmentAvailable(
    model: ProbeInput['model'],
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): void {
    const sefazModel: SefazFiscalModel = model === 'NFCE' ? '65' : '55';
    resolveSefazBaEndpoint('NFeStatusServico4', environment, sefazModel);
  }

  async probe(input: ProbeInput): Promise<ProbeResult> {
    const authority: Authority = input.model === 'NFCE' ? 'SVRS' : 'SEFAZ-BA';
    const model: SefazFiscalModel = input.model === 'NFCE' ? '65' : '55';

    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      // A checagem de tenant/existência é do caso de uso; se chegou aqui sem
      // empresa, é falha local, não do órgão.
      return this.localError(authority, 'Emitente não encontrado.');
    }

    const certificate = await this.certificateRepository.findValidByCompanyId(
      input.companyId,
    );
    if (!certificate || !certificate.isValidNow()) {
      return this.localError(
        authority,
        'Certificado digital ausente ou vencido — não é possível consultar o órgão.',
      );
    }

    let keyMaterial: { privateKeyPem: string; certificatePem: string };
    try {
      keyMaterial = await loadCertificateKeyMaterial(
        this.objectStorage,
        certificate,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao carregar material do certificado (company=${input.companyId}): ${String(error)}`,
      );
      return this.localError(
        authority,
        'Não foi possível carregar o certificado digital.',
      );
    }

    const cUF = company.cityCodeIbge.slice(0, 2);

    try {
      const soapResult = await callSefazSoapOperation({
        // `wsdlPath` é ignorado pelo cliente (envelope montado à mão) — ver
        // sefaz-soap-client.ts. Passamos um rótulo, não um caminho real.
        wsdlPath: 'NFeStatusServico4',
        endpoint: resolveSefazBaEndpoint(
          'NFeStatusServico4',
          input.environment,
          model,
        ),
        operation: 'nfeStatusServicoNF',
        requestElementName: 'nfeDadosMsg',
        requestNamespace: STATUS_NAMESPACE,
        requestBodyXml: buildConsStatServXml({
          environment: input.environment,
          cUF,
        }),
        responseWrapperLocalName: 'nfeResultMsg',
        privateKeyPem: keyMaterial.privateKeyPem,
        certificatePem: keyMaterial.certificatePem,
        timeoutMs: PROBE_TIMEOUT_MS,
        maxRetries: 0,
      });

      const parsed = parseRetConsStatServXml(soapResult.responseBodyXml);
      const mapped = mapCstatToStatus(parsed.cStat);
      if (mapped.unrecognized) {
        this.logger.warn(
          `cStat não reconhecido de ${authority} (${input.model}): "${parsed.cStat}" — ${parsed.xMotivo ?? ''}`,
        );
      }
      return {
        status: mapped.status,
        authority,
        authorityMessage: parsed.xMotivo,
        expectedReturnAt: parsed.dhRetorno,
      };
    } catch (error) {
      // Achado 2026-08-14: bundle ICP-Brasil ausente é falha de
      // CONFIGURAÇÃO LOCAL deste deploy — nunca existiu conexão com o
      // órgão, então não é `UNREACHABLE` (que um operador lê como "a SEFAZ
      // está fora do ar" e não tem o que fazer a respeito). `LOCAL_ERROR`
      // aponta pro problema certo, no lugar certo (mesmo tratamento de
      // certificado ausente/vencido, acima).
      if (error instanceof SefazCaBundleNotFoundError) {
        this.logger.warn(
          `Órgão ${authority} não consultado (${input.model}): ${error.internalMessage}`,
        );
        return this.localError(
          authority,
          'Cadeia de certificação ICP-Brasil não configurada neste ambiente.',
        );
      }

      // Timeout / erro de transporte / TLS: NÃO respondeu. FR-003 — nunca
      // OPERATIONAL por ausência de resposta.
      this.logger.log(
        `Órgão ${authority} inalcançável (${input.model}): ${String(error)}`,
      );
      return {
        status: 'UNREACHABLE',
        authority,
        authorityMessage: null,
        expectedReturnAt: null,
      };
    }
  }

  private localError(authority: Authority, message: string): ProbeResult {
    return {
      status: 'LOCAL_ERROR',
      authority,
      authorityMessage: message,
      expectedReturnAt: null,
    };
  }
}

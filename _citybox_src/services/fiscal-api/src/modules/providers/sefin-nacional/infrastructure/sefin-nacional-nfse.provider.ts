import { Injectable, Logger } from '@nestjs/common';
import { CertificateRepository } from '../../../certificates/domain/repositories/certificate.repository.interface';
import { FiscalDocumentRepository } from '../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalDocumentNotFoundError } from '../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { ObjectStorage } from '../../../../shared/domain/storage/object-storage.interface';
import {
  FiscalProvider,
  type CancelDocumentInput,
  type CancelDocumentResult,
  type ConsultDocumentInput,
  type ConsultDocumentResult,
  type CorrectionLetterInput,
  type CorrectionLetterResult,
  type InutilizeDocumentInput,
  type InutilizeDocumentResult,
  type IssueDocumentInput,
  type IssueDocumentResult,
} from '../../../../shared/domain/fiscal-provider.interface';
import { NfseCorrectionLetterNotApplicableError } from '../../../../shared/domain/errors/nfse-correction-letter-not-applicable.error';
import { NfseInutilizationNotApplicableError } from '../../../../shared/domain/errors/nfse-inutilization-not-applicable.error';
import { CertificateNotValidError } from '../../../nfe/domain/errors/certificate-not-valid.error';
import { loadCertificateKeyMaterial } from '../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { callSefin } from '../../../../shared/infra/fiscal-http/sefin-http-client';
import {
  encodeDpsPayload,
  encodeEventPayload,
} from '../../../../shared/infra/fiscal-http/payload-encoding';
import { resolveSefinEndpoint } from '../../../../shared/infra/fiscal-http/sefin-nacional-config';
import {
  parseSefinEventResponse,
  parseSefinIssueResponse,
} from './sefin-nacional-response';
import {
  parseSefinEventsResponse,
  type RemoteFiscalEvent,
} from './sefin-nacional-events-response';
import { SefinOperationNotImplementedError } from '../errors/sefin-operation-not-implemented.error';

/// `FiscalProvider` concreto para NFS-e pelo **Sistema Nacional** (Sefin
/// Nacional / ADN), substituindo o stub municipal de Ilhéus — o município
/// aderiu ao padrão nacional (Decreto Municipal nº 220/2026).
///
/// Contrato confirmado no OpenAPI oficial (lido em 2026-08-06 com certificado
/// de cliente, que é exigido até para ler a documentação):
/// `POST /nfse` recebe `{ dpsXmlGZipB64 }` e devolve a NFS-e gerada.
///
/// ⚠️ **Produção é recusada estruturalmente**: `resolveSefinEndpoint` lança
/// quando `SEFIN_NACIONAL_PRODUCTION_ENDPOINT` não está definida, e ela não
/// tem valor padrão. Emitir em produção cria documento com valor legal e
/// obrigação tributária — é decisão de negócio, não de configuração.
@Injectable()
export class SefinNacionalNfseProvider extends FiscalProvider {
  private readonly logger = new Logger(SefinNacionalNfseProvider.name);

  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly objectStorage: ObjectStorage,
  ) {
    super();
  }

  async issue(input: IssueDocumentInput): Promise<IssueDocumentResult> {
    const { privateKeyPem, certificatePem } = await this.loadKeyMaterial(
      input.fiscalDocumentId,
    );

    const dpsXmlGZipB64 = encodeDpsPayload(input.signedXml.toString('utf-8'));

    this.logger.log(
      `Emitindo NFS-e (fiscalDocumentId=${input.fiscalDocumentId}, ambiente=${input.environment})`,
    );

    const response = await callSefin({
      endpoint: resolveSefinEndpoint('nfse', input.environment),
      method: 'POST',
      body: { dpsXmlGZipB64 },
      privateKeyPem,
      certificatePem,
    });

    const outcome = parseSefinIssueResponse(response.json);

    if (outcome.status === 'AUTHORIZED') {
      return {
        status: 'AUTHORIZED',
        accessKey: outcome.accessKey,
        authorizedXml: Buffer.from(outcome.nfseXml, 'utf-8'),
        // O padrão nacional não devolve "protocolo" separado: a chave de
        // acesso é o identificador do documento gerado.
        protocol: outcome.accessKey,
        rawRequestXml: JSON.stringify({ dpsXmlGZipB64 }),
        rawResponseXml: response.rawBody,
      };
    }

    return {
      status: 'REJECTED',
      errorCode: outcome.errorCode,
      errorMessage: outcome.errorMessage,
      rawRequestXml: JSON.stringify({ dpsXmlGZipB64 }),
      rawResponseXml: response.rawBody,
    };
  }

  /// Mesma antecipacao de `SefazBaNfeProvider`: falhar antes de queimar numero.
  assertEnvironmentAvailable(environment: 'HOMOLOGATION' | 'PRODUCTION'): void {
    resolveSefinEndpoint('nfse', environment);
  }

  async consult(input: ConsultDocumentInput): Promise<ConsultDocumentResult> {
    const document = await this.fiscalDocumentRepository.findById(
      input.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        SefinNacionalNfseProvider.name,
        input.fiscalDocumentId,
      );
    }

    const accessKey = input.accessKey ?? document.accessKey;
    if (!accessKey) {
      return {
        status: 'REJECTED',
        errorMessage:
          'Documento sem chave de acesso — não é possível consultar',
      };
    }

    const { privateKeyPem, certificatePem } = await this.loadKeyMaterial(
      input.fiscalDocumentId,
    );

    // Dois recursos distintos, discriminados pelo próprio identificador. Antes
    // do desfecho, `accessKey` guarda o `Id` da DPS (prefixo "DPS", 45 chars —
    // `dps-id.ts`); depois, a chave de acesso da NFS-e devolvida pelo órgão.
    // Consultar `nfse/{id}` com um id de DPS é o recurso errado.
    //
    // `GET /dps/{id}` responde `E2404` ("não foi gerada uma NFS-e com o
    // identificador informado") quando a DPS não virou nota — verificado
    // contra o serviço real em 2026-08-06, que aceita o id com e sem o
    // prefixo. É a consulta que permite retomar transmissão sem duplicar.
    const path = accessKey.startsWith('DPS')
      ? `dps/${accessKey}`
      : `nfse/${accessKey}`;

    const response = await callSefin({
      endpoint: resolveSefinEndpoint(path, document.environment),
      method: 'GET',
      privateKeyPem,
      certificatePem,
    });

    const outcome = parseSefinIssueResponse(response.json);
    if (outcome.status === 'AUTHORIZED') {
      return {
        status: 'AUTHORIZED',
        protocol: outcome.accessKey,
        authorizedXml: Buffer.from(outcome.nfseXml, 'utf-8'),
      };
    }
    return { status: 'REJECTED', errorMessage: outcome.errorMessage };
  }

  /// Cancelamento no padrão nacional é um **evento** registrado contra a chave
  /// de acesso, não uma operação própria: `POST /nfse/{chave}/eventos`.
  ///
  /// O XML do pedido chega pronto e assinado (`signedEventXml`) — montar e
  /// assinar ficam no caso de uso, como na emissão, porque é ele que conhece a
  /// parametrização municipal e escolhe entre `e101101` e `e101103`.
  ///
  /// ⚠️ Ver `SEFIN_EVENT_PAYLOAD_FIELD`: o nome do campo do corpo é suposição
  /// não confirmada, sobrescrevível por env.
  async cancel(input: CancelDocumentInput): Promise<CancelDocumentResult> {
    if (!input.signedEventXml) {
      throw new SefinOperationNotImplementedError(
        SefinNacionalNfseProvider.name,
        `cancel sem signedEventXml (fiscalDocumentId=${input.fiscalDocumentId})`,
      );
    }

    const document = await this.fiscalDocumentRepository.findById(
      input.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        SefinNacionalNfseProvider.name,
        input.fiscalDocumentId,
      );
    }

    const { privateKeyPem, certificatePem } = await this.loadKeyMaterial(
      input.fiscalDocumentId,
    );

    const body = encodeEventPayload(input.signedEventXml.toString('utf-8'));
    const response = await callSefin({
      endpoint: resolveSefinEndpoint(
        `nfse/${document.accessKey ?? ''}/eventos`,
        document.environment,
      ),
      method: 'POST',
      body,
      privateKeyPem,
      certificatePem,
    });

    const outcome = parseSefinEventResponse(response.json);
    return {
      status: outcome.accepted ? 'CANCEL_AUTHORIZED' : 'CANCEL_REJECTED',
      protocol: outcome.protocol,
      errorMessage: outcome.errorMessage,
      rawRequestXml: JSON.stringify(body),
      rawResponseXml: response.rawBody,
    };
  }

  /// Lê a linha do tempo de eventos da nota no ambiente nacional
  /// (`GET /nfse/{chave}/eventos`) — T035.
  ///
  /// Existe porque **nem todo evento é nosso**: o município lança eventos de
  /// ofício (cancelamento por análise fiscal deferido/indeferido, bloqueios)
  /// que nunca passaram por esta API. Sem sincronizar, a linha do tempo que
  /// mostramos ao contribuinte estaria incompleta exatamente nos casos em que
  /// ele mais precisa dela.
  ///
  /// Falha de comunicação **não** derruba a consulta: devolve lista vazia e
  /// registra. Uma consulta que quebra porque o órgão está fora do ar é pior
  /// que uma linha do tempo temporariamente sem os eventos remotos — os nossos,
  /// que já estão no banco, seguem visíveis.
  async syncEvents(fiscalDocumentId: string): Promise<RemoteFiscalEvent[]> {
    const document =
      await this.fiscalDocumentRepository.findById(fiscalDocumentId);
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        SefinNacionalNfseProvider.name,
        fiscalDocumentId,
      );
    }

    const accessKey = document.accessKey;
    // Antes do desfecho `accessKey` guarda o `Id` da DPS, que não nomeia uma
    // NFS-e — não há eventos a buscar.
    if (!accessKey || accessKey.startsWith('DPS')) return [];

    try {
      const { privateKeyPem, certificatePem } =
        await this.loadKeyMaterial(fiscalDocumentId);

      const response = await callSefin({
        endpoint: resolveSefinEndpoint(
          `nfse/${accessKey}/eventos`,
          document.environment,
        ),
        method: 'GET',
        privateKeyPem,
        certificatePem,
      });

      return parseSefinEventsResponse(response.json);
    } catch (error) {
      this.logger.warn(
        `Não foi possível sincronizar eventos da NFS-e ${fiscalDocumentId}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /// Carta de correção não existe no padrão nacional de NFS-e (é exclusiva de
  /// NF-e por desenho legal) — rejeitar com erro claro em vez de implementar
  /// algo sem sentido.
  correctionLetter(
    input: CorrectionLetterInput,
  ): Promise<CorrectionLetterResult> {
    return Promise.reject(
      new NfseCorrectionLetterNotApplicableError(
        SefinNacionalNfseProvider.name,
        input.fiscalDocumentId,
      ),
    );
  }

  /// Inutilização de faixa de numeração também é conceito de NF-e: a DPS não
  /// tem numeração pré-reservada a inutilizar.
  inutilize(input: InutilizeDocumentInput): Promise<InutilizeDocumentResult> {
    return Promise.reject(
      new NfseInutilizationNotApplicableError(
        SefinNacionalNfseProvider.name,
        input.companyId,
      ),
    );
  }

  private async loadKeyMaterial(fiscalDocumentId: string) {
    const document =
      await this.fiscalDocumentRepository.findById(fiscalDocumentId);
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        SefinNacionalNfseProvider.name,
        fiscalDocumentId,
      );
    }

    const certificate = await this.certificateRepository.findValidByCompanyId(
      document.companyId,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(
        SefinNacionalNfseProvider.name,
        document.companyId,
      );
    }

    return loadCertificateKeyMaterial(this.objectStorage, certificate);
  }
}

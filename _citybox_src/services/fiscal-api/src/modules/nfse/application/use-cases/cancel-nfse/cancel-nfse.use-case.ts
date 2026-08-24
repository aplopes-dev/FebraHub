import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { NfseDocumentNotAuthorizedError } from '../../../domain/errors/nfse-document-not-authorized.error';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CertificateRepository } from '../../../../certificates/domain/repositories/certificate.repository.interface';
import { CertificateNotValidError } from '../../../../nfe/domain/errors/certificate-not-valid.error';
import { MunicipalParametersService } from '../../services/municipal-parameters.service';
import { resolveCancelPath } from '../../../domain/rules/nfse-cancel-path';
import { buildEventoXml } from '../../../infrastructure/xml/evento-xml.builder';
import { loadCertificateKeyMaterial } from '../../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import type { CancelNfseDto } from '../../dtos/nfse.dto';
import type { CancelPath } from '../../../domain/rules/nfse-cancel-path';

/// O caminho decidido faz parte do resultado, nao e detalhe interno: quem
/// chamou precisa saber se a nota FOI cancelada (`DIRECT`) ou se o pedido esta
/// em julgamento pelo municipio (`FISCAL_ANALYSIS`) — sao situacoes fiscais
/// diferentes, e a interface do lojista tem de dizer qual e.
export type CancelNfseResult = {
  document: FiscalDocument;
  path: CancelPath;
};

/// Cancelamento de NFS-e dentro do prazo legal (US4/T067,
/// contracts/nfse-api.md `POST /nfse/{id}/cancel` — "mesma semântica de
/// nfe-api.md"). Estruturalmente idêntico a `CancelNfeUseCase`: mesma regra
/// de prazo (`nfe-cancel-deadline.ts` já cobre `FiscalDocumentType.NFSE`),
/// mesma persistência de `ProviderRequest`/`FiscalEvent`. Duplicado em vez
/// de compartilhado deliberadamente — extrair uma base genérica
/// (`CancelFiscalDocumentUseCase`) é um refactor à parte, fora do escopo
/// desta tarefa (evita misturar duas mudanças numa só entrega).
///
@Injectable()
export class CancelNfseUseCase implements IUseCase<
  CancelNfseDto,
  CancelNfseResult
> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly municipalParametersService: MunicipalParametersService,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: CancelNfseDto): Promise<CancelNfseResult> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        CancelNfseUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    if (document.status !== 'AUTHORIZED' || !document.authorizedAt) {
      throw new NfseDocumentNotAuthorizedError(
        CancelNfseUseCase.name,
        document.id,
        document.status,
        'cancel',
      );
    }

    const now = new Date();

    const company = await this.companyRepository.findById(document.companyId);
    if (!company) {
      throw new CompanyNotFoundError(
        CancelNfseUseCase.name,
        document.companyId,
      );
    }

    const certificate = await this.certificateRepository.findValidByCompanyId(
      company.id,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(CancelNfseUseCase.name, company.id);
    }

    const { privateKeyPem, certificatePem } = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );

    // FR-012 — o prazo sai da parametrização do município, não de constante.
    // Fora dele o pedido NÃO é recusado: vira solicitação de análise fiscal.
    // Quem pede não escolhe entre os dois caminhos, e não precisa saber que
    // existem.
    const parameters = await this.municipalParametersService.resolve({
      cityCodeIbge: company.cityCodeIbge,
      environment: document.environment,
      privateKeyPem,
      certificatePem,
    });

    const path = resolveCancelPath({
      authorizedAt: document.authorizedAt,
      now,
      parameters,
    });

    const { xml: unsignedEvent } = buildEventoXml({
      environment: document.environment,
      // `CancelPath` fala de caminho decidido, `EventoKind` fala de evento do
      // leiaute. Mapeados aqui em vez de unificados: sao vocabularios de
      // camadas diferentes e colapsa-los amarraria a regra de dominio ao XSD.
      kind: path === 'DIRECT' ? 'CANCEL' : 'FISCAL_ANALYSIS',
      authorAtDocument: { documentType: 'CNPJ', document: company.cnpj },
      // Não-nulo garantido pelo guard de status AUTHORIZED acima: documento
      // autorizado tem chave de acesso devolvida pelo órgão.
      nfseAccessKey: document.accessKey ?? '',
      reasonCode: '1',
      reasonText: dto.justification,
      now,
    });

    const signedEventXml = signXml({
      xml: unsignedEvent.toString('utf-8'),
      privateKeyPem,
      certificatePem,
      referenceXPath: "//*[local-name(.)='infPedReg']",
      signatureLocationXPath: "//*[local-name(.)='pedRegEvento']",
      algorithmProfile: 'MODERN',
    });

    const provider = this.providerFactory.getProvider(document.provider);
    const result = await provider.cancel({
      fiscalDocumentId: document.id,
      // Não-nulo garantido pelo guard de status AUTHORIZED acima.
      protocol: document.protocol ?? '',
      justification: dto.justification,
      signedEventXml: Buffer.from(signedEventXml, 'utf-8'),
    });

    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: document.companyId,
      documentId: document.id,
      documentKind: 'nfse',
      operation: 'CANCEL',
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: document.id,
          provider: document.provider,
          operation: 'CANCEL',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          responsePayload: {
            status: result.status,
            protocol: result.protocol ?? null,
          },
          status: result.status === 'CANCEL_AUTHORIZED' ? 'SUCCESS' : 'ERROR',
          errorMessage: result.errorMessage ?? null,
          createdAt: now,
        },
        randomUUID(),
      ),
    );

    await this.fiscalEventRepository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: document.id,
          eventType: 'CANCEL',
          sequence: null,
          status: result.status,
          justification: dto.justification,
          correctionText: null,
          protocol: result.protocol ?? null,
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          // O código reflete o caminho decidido: `e101101` cancelamento
          // direto, `e101103` solicitação de análise fiscal. `ambGer=2`: o
          // evento é registrado pela Sefin Nacional, não por sistema próprio
          // do município.
          nationalEventCode: path === 'DIRECT' ? 'e101101' : 'e101103',
          generatorEnvironment: 2,
          replacedByDocumentId: null,
          createdAt: now,
          companyId: null,
          series: null,
          numberRangeStart: null,
          numberRangeEnd: null,
        },
        randomUUID(),
      ),
    );

    // Analise fiscal NAO cancela a nota: registra um pedido que o municipio
    // julga. Marcar `CANCEL_AUTHORIZED` aqui diria ao lojista que a nota ja
    // esta cancelada quando ela segue valida — e ele agiria em cima disso.
    const acceptedByProvider = result.status === 'CANCEL_AUTHORIZED';
    // Recusa mantem o documento como estava: a nota segue valida no orgao, e
    // travar em `CANCEL_REJECTED` impediria nova tentativa apos uma falha
    // transitoria. Mesma razao de `CancelNfeUseCase`.
    const finalStatus = !acceptedByProvider
      ? document.status
      : path === 'DIRECT'
        ? 'CANCEL_AUTHORIZED'
        : 'CANCEL_REQUESTED';

    const updated = FiscalDocument.with(
      {
        ...document.props,
        status: finalStatus,
        protocol: result.protocol ?? document.protocol,
        // `cancelledAt` so em cancelamento efetivo — em analise fiscal a nota
        // ainda vale, e uma data aqui a faria parecer cancelada em relatorio.
        cancelledAt:
          finalStatus === 'CANCEL_AUTHORIZED' ? now : document.cancelledAt,
        errorMessage: result.errorMessage ?? document.errorMessage,
      },
      document.id,
    ).withItems(document.items);

    return {
      document: await this.fiscalDocumentRepository.save(updated),
      path,
    };
  }
}

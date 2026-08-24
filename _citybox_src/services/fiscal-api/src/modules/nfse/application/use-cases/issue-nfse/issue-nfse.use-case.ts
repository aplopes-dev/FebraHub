import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CertificateRepository } from '../../../../certificates/domain/repositories/certificate.repository.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { CustomerRepository } from '../../../../fiscal-documents/domain/repositories/customer.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../../../../fiscal-documents/domain/entities/fiscal-document-item.entity';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { SeriesInactiveError } from '../../../../fiscal-sequences/domain/errors/series-inactive.error';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { Customer } from '../../../../fiscal-documents/domain/entities/customer.entity';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import type { ConsultDocumentResult } from '../../../../../shared/domain/fiscal-provider.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { validateNfseItems } from '../../../domain/validators/nfse-item.zod.validator';
import { MunicipalityNotSupportedError } from '../../../domain/errors/municipality-not-supported.error';
import { CertificateNotValidError } from '../../../../nfe/domain/errors/certificate-not-valid.error';
import { loadCertificateKeyMaterial } from '../../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { buildDpsXml } from '../../../infrastructure/xml/dps-xml.builder';
import { NFSE_DPS_XSD_PATH } from '../../../infrastructure/xml/nfse-xsd-path';
import type { IssueNfseDto } from '../../dtos/nfse.dto';
import { isTerminalStatus } from '../../../../fiscal-documents/domain/entities/fiscal-document-status';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import { SignedXmlNotFoundError } from '../../../../nfe/domain/errors/signed-xml-not-found.error';

/// Chave do XML assinado da DPS guardado ANTES da transmissão — distinta da
/// chave do documento autorizado (`.../nfse/xml/...`), que só existe após
/// desfecho do órgão fiscal.
function signedDpsObjectKey(companyId: string, documentId: string): string {
  return `${companyId}/nfse/dps/${documentId}.xml`;
}

const logger = new Logger('IssueNfseUseCase');

@Injectable()
export class IssueNfseUseCase implements IUseCase<
  IssueNfseDto,
  FiscalDocument
> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalSequenceRepository: FiscalSequenceRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(dto: IssueNfseDto): Promise<FiscalDocument> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(IssueNfseUseCase.name, dto.companyId);
    }

    // Idempotência (FR-013, SC-007) — mesma regra de NF-e.
    const existing = await this.fiscalDocumentRepository.findByIdempotency({
      companyId: company.id,
      sourceSystem: dto.sourceSystem,
      externalReference: dto.externalReference,
      documentType: 'NFSE',
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) {
      // Estado terminal: desfecho já obtido junto ao órgão fiscal, o reenvio é
      // repetição legítima. Não terminal (SIGNED/SENT/PROCESSING/SYNC_REQUIRED):
      // a nota foi numerada e assinada mas não chegou a desfecho — retomar a
      // transmissão em vez de devolver o estado intermediário como final, que
      // queimaria a chave de idempotência por indisponibilidade momentânea.
      // Mesma regra do NF-e, agora compartilhada em `fiscal-document-status.ts`.
      if (isTerminalStatus(existing.status)) return existing;
      return this.resumeTransmission(existing);
    }

    // FR-020/US2 Acceptance Scenario 2 — município não aderente ao Padrão
    // Nacional é recusado ANTES de qualquer outra validação ou transmissão.
    // A adesão é fato cadastral do município (`nationalNfseEnabled`), não
    // lista em código: aderir não pode exigir deploy.
    if (!company.isEnabledForNationalNfse()) {
      throw new MunicipalityNotSupportedError(
        IssueNfseUseCase.name,
        company.cityCodeIbge,
      );
    }

    // Completude do(s) item(ns) de serviço (mesma lógica de SC-004 de NF-e).
    validateNfseItems(dto.items, IssueNfseUseCase.name);

    // FR-008 — bloqueia emissão sem certificado válido e vigente.
    const certificate = await this.certificateRepository.findValidByCompanyId(
      company.id,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(IssueNfseUseCase.name, company.id);
    }

    const environment = dto.environment ?? company.defaultEnvironment;

    // ANTES de reservar numero — mesma razao de `IssueNfeUseCase`: recusa de
    // ambiente na transmissao queimava numeracao e deixava documento orfao.
    this.providerFactory
      .getProvider('SEFIN_NACIONAL')
      .assertEnvironmentAvailable(environment);
    const series = '1';

    const sequence = await this.reserveNextNumber(
      company.id,
      series,
      environment,
    );

    const customer = await this.resolveCustomer(company.id, dto.customer);

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );

    // Constrói + assina + valida (FR-009) o XML da DPS.
    const { xml: unsignedXml, dpsId } = buildDpsXml({
      environment,
      provider: {
        cnpj: company.cnpj,
        municipalRegistration: company.municipalRegistration,
        legalName: company.legalName,
        cityCodeIbge: company.cityCodeIbge,
        simplesNacionalOption:
          company.taxRegime === 'SIMPLES_NACIONAL' ? '3' : '1',
      },
      customer: {
        documentType: customer.documentType,
        document: customer.document,
        name: customer.name,
      },
      service: {
        description: dto.nfse.serviceDescription,
        municipalServiceCode: dto.nfse.municipalServiceCode,
        nationalServiceCode: dto.nfse.nationalServiceCode,
        issRate: dto.nfse.issRate,
        issWithheld: dto.nfse.issWithheld,
        tribISSQN: dto.nfse.tribISSQN,
        totalValue: totalAmount,
      },
      series,
      number: String(sequence.currentNumber),
      substitution: dto.substitution,
    });

    const { privateKeyPem, certificatePem } = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );

    const signedXml = signXml({
      xml: unsignedXml.toString(),
      privateKeyPem,
      certificatePem,
      referenceXPath: "//*[local-name(.)='infDPS']",
      signatureLocationXPath: "//*[local-name(.)='DPS']",
      algorithmProfile: 'MODERN',
    });

    assertValidXml(signedXml, NFSE_DPS_XSD_PATH, IssueNfseUseCase.name);

    const now = new Date();
    const document = FiscalDocument.with(
      {
        companyId: company.id,
        customerId: customer.id,
        documentType: 'NFSE',
        provider: 'SEFIN_NACIONAL',
        environment,
        status: 'SIGNED',
        sourceSystem: dto.sourceSystem,
        externalReference: dto.externalReference,
        idempotencyKey: dto.idempotencyKey,
        series,
        number: String(sequence.currentNumber),
        rpsSeries: null,
        rpsNumber: null,
        accessKey: dpsId,
        verificationCode: null,
        protocol: null,
        totalAmount,
        xmlObjectKey: null,
        errorCode: null,
        errorMessage: null,
        issuedAt: now,
        authorizedAt: null,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      },
      randomUUID(),
    );
    document.withItems(
      dto.items.map((item) =>
        FiscalDocumentItem.with(
          {
            fiscalDocumentId: document.id,
            description: item.description,
            quantity: item.quantity,
            unitValue: item.unitValue,
            totalValue: item.totalValue,
            itemType: 'SERVICE',
            ncm: null,
            cfop: null,
            cst: null,
            csosn: null,
            serviceCode: item.serviceCode,
            taxJson: item.taxJson ?? null,
          },
          randomUUID(),
        ),
      ),
    );

    // Persistir ANTES de transmitir: um provider real recarrega o documento
    // por id para resolver o certificado do Emitente. Também é o que torna
    // auditável "assinei e numerei, mas o órgão não respondeu" — o número da
    // FiscalSequence já foi consumido. Não reatribuir `document`: `save`
    // devolve a entidade relida e a resposta perderia os itens em memória.
    await this.fiscalDocumentRepository.save(document);

    // O XML assinado da DPS guardado antes da tentativa é o que permite
    // retomar sem re-assinar — re-assinar geraria identificador diferente para
    // uma DPS que o órgão fiscal pode já ter recebido.
    await this.objectStorage.put({
      key: signedDpsObjectKey(company.id, document.id),
      buffer: Buffer.from(signedXml, 'utf-8'),
      mimeType: 'application/xml',
    });

    return this.transmitAndPersist(document, signedXml, environment);
  }

  /// Retoma a transmissão de uma DPS já numerada e assinada, relendo o XML
  /// gravado antes da tentativa anterior.
  private async resumeTransmission(
    document: FiscalDocument,
  ): Promise<FiscalDocument> {
    const key = signedDpsObjectKey(document.companyId, document.id);

    if (!(await this.objectStorage.exists(key))) {
      throw new SignedXmlNotFoundError(IssueNfseUseCase.name, document.id);
    }

    // T023 — consultar ANTES de retransmitir. O caso perigoso não é a
    // transmissão que falhou: é a que chegou ao órgão e cuja resposta se
    // perdeu. Retransmitir ali gera uma segunda nota, que é dano fiscal, não
    // erro de aplicação. `GET /dps/{id}` desfaz a ambiguidade.
    //
    // Só AUTHORIZED interrompe a retomada. Rejeitado ou inexistente
    // (`E2404` — verificado contra o serviço real) significa que não há nota
    // para duplicar, e transmitir é o certo. Falha na própria consulta também
    // segue para transmissão: ficar preso por indisponibilidade da consulta
    // seria trocar um risco por uma paralisia garantida.
    const alreadyIssued = await this.findOutcomeAtProvider(document);
    if (alreadyIssued) return alreadyIssued;

    const stored = await this.objectStorage.get(key);
    return this.transmitAndPersist(
      document,
      stored.buffer.toString('utf-8'),
      document.environment,
    );
  }

  /// Devolve o documento persistido quando o órgão fiscal JÁ tem a NFS-e
  /// autorizada; `null` quando não há nada a adotar e a transmissão deve seguir.
  private async findOutcomeAtProvider(
    document: FiscalDocument,
  ): Promise<FiscalDocument | null> {
    const provider = this.providerFactory.getProvider('SEFIN_NACIONAL');

    let result: ConsultDocumentResult;
    try {
      result = await provider.consult({ fiscalDocumentId: document.id });
    } catch (error) {
      logger.warn(
        `Consulta prévia à retomada falhou (fiscalDocumentId=${document.id}); ` +
          `seguindo para transmissão: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }

    if (result.status !== 'AUTHORIZED') return null;

    logger.log(
      `NFS-e já autorizada no órgão fiscal (fiscalDocumentId=${document.id}) — ` +
        'adotando o desfecho existente em vez de retransmitir',
    );

    const adopted = FiscalDocument.with(
      {
        ...document.props,
        status: 'AUTHORIZED',
        protocol: result.protocol ?? document.protocol,
        authorizedAt: document.authorizedAt ?? new Date(),
        errorCode: null,
        errorMessage: null,
      },
      document.id,
    ).withItems(document.items);

    return this.fiscalDocumentRepository.save(adopted);
  }

  private async transmitAndPersist(
    signedDocument: FiscalDocument,
    signedXml: string,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): Promise<FiscalDocument> {
    let document = signedDocument;

    const provider = this.providerFactory.getProvider('SEFIN_NACIONAL');
    const result = await provider.issue({
      fiscalDocumentId: document.id,
      environment,
      signedXml: Buffer.from(signedXml, 'utf-8'),
    });

    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: document.companyId,
      documentId: document.id,
      documentKind: 'nfse',
      operation: 'ISSUE',
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: document.id,
          provider: 'SEFIN_NACIONAL',
          operation: 'ISSUE',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          responsePayload: {
            status: result.status,
            protocol: result.protocol ?? null,
            accessKey: result.accessKey ?? null,
            errorCode: result.errorCode ?? null,
          },
          status: result.status === 'AUTHORIZED' ? 'SUCCESS' : 'ERROR',
          errorMessage: result.errorMessage ?? null,
          createdAt: new Date(),
        },
        randomUUID(),
      ),
    );

    if (result.status === 'AUTHORIZED') {
      const xmlToStore =
        result.authorizedXml ?? Buffer.from(signedXml, 'utf-8');
      const xmlObjectKey = `${document.companyId}/nfse/xml/${document.id}.xml`;
      await this.objectStorage.put({
        key: xmlObjectKey,
        buffer: xmlToStore,
        mimeType: 'application/xml',
      });

      document = FiscalDocument.with(
        {
          ...document.props,
          status: 'AUTHORIZED',
          protocol: result.protocol ?? null,
          // A chave da NFS-e SUBSTITUI o `Id` da DPS: antes do desfecho o campo
          // guarda o identificador do pedido, depois tem de guardar o do
          // DOCUMENTO gerado. Ficava so em `protocol`, e isso quebrava duas
          // coisas em silencio — a substituicao montava o `Id` do evento
          // `e105102` com o id da DPS (rejeicao `E1235` do Sefin), e `consult`
          // roteia por `accessKey.startsWith('DPS')`, entao nunca chegava a
          // consultar `/nfse/{chave}`.
          //
          // Sem chave devolvida, mantem o id da DPS: ainda identifica o
          // documento em `GET /dps/{id}`, o que `null` nao faria.
          accessKey: result.accessKey ?? document.accessKey,
          xmlObjectKey,
          authorizedAt: new Date(),
        },
        document.id,
      ).withItems(document.items);
    } else if (result.status === 'REJECTED') {
      document = FiscalDocument.with(
        {
          ...document.props,
          status: 'REJECTED',
          errorCode: result.errorCode ?? null,
          errorMessage: result.errorMessage ?? null,
        },
        document.id,
      ).withItems(document.items);
    } else {
      document = FiscalDocument.with(
        { ...document.props, status: 'SYNC_REQUIRED' },
        document.id,
      ).withItems(document.items);
    }

    return this.fiscalDocumentRepository.save(document);
  }

  private async reserveNextNumber(
    companyId: string,
    series: string,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ) {
    const key = {
      companyId,
      documentType: 'NFSE' as const,
      series,
      environment,
    };
    const existing = await this.fiscalSequenceRepository.findByKey(key);
    // Série desativada recusa a emissão com erro específico (spec erp/011, FR-006).
    if (existing && !existing.active) {
      throw new SeriesInactiveError(IssueNfseUseCase.name, series);
    }
    const sequence =
      existing ??
      FiscalSequence.with(
        { ...key, currentNumber: 0n, active: true },
        randomUUID(),
      );
    sequence.reserveNext();
    return this.fiscalSequenceRepository.save(sequence);
  }

  private async resolveCustomer(
    companyId: string,
    dto: IssueNfseDto['customer'],
  ): Promise<Customer> {
    const existing = await this.customerRepository.findByDocument(
      companyId,
      dto.document,
    );
    if (existing) return existing;

    const customer = Customer.create({
      companyId,
      documentType: dto.documentType,
      document: dto.document,
      name: dto.name,
      email: dto.email ?? null,
      address: dto.address ?? {
        street: '',
        number: 'S/N',
        district: '',
        city: '',
        uf: '',
      },
    });
    return this.customerRepository.save(customer);
  }
}

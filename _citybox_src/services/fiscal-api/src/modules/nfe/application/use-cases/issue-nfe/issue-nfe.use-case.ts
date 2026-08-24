import { Injectable } from '@nestjs/common';
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
import { isTerminalStatus } from '../../../../fiscal-documents/domain/entities/fiscal-document-status';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import { FiscalDocumentItem } from '../../../../fiscal-documents/domain/entities/fiscal-document-item.entity';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { SeriesInactiveError } from '../../../../fiscal-sequences/domain/errors/series-inactive.error';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { Customer } from '../../../../fiscal-documents/domain/entities/customer.entity';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { validateNfeItems } from '../../../domain/validators/nfe-item.zod.validator';
import { toNfeItemInput } from '../../mappers/nfe-item-input.mapper';
import { CertificateNotValidError } from '../../../domain/errors/certificate-not-valid.error';
import { SignedXmlNotFoundError } from '../../../domain/errors/signed-xml-not-found.error';
import { loadCertificateKeyMaterial } from '../../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import { buildNfeXml } from '../../../infrastructure/xml/nfe-xml.builder';
import { NFE_XSD_PATH } from '../../../infrastructure/xml/nfe-xsd-path';
import type { IssueNfeDto } from '../../dtos/nfe.dto';

/// Chave do XML assinado guardado ANTES da transmissão — distinta da chave do
/// XML autorizado (`.../nfe/xml/...`), que só existe após protocolo.
function signedXmlObjectKey(companyId: string, documentId: string): string {
  return `${companyId}/nfe/signed/${documentId}.xml`;
}

@Injectable()
export class IssueNfeUseCase implements IUseCase<IssueNfeDto, FiscalDocument> {
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

  async execute(dto: IssueNfeDto): Promise<FiscalDocument> {
    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(IssueNfeUseCase.name, dto.companyId);
    }

    // Idempotência (FR-013, SC-007) — checa ANTES de qualquer trabalho, uma
    // requisição repetida retorna o documento já existente sem reprocessar.
    const existing = await this.fiscalDocumentRepository.findByIdempotency({
      companyId: company.id,
      sourceSystem: dto.sourceSystem,
      externalReference: dto.externalReference,
      documentType: 'NFE',
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) {
      // Estado terminal: a nota já teve desfecho junto ao órgão fiscal, o
      // reenvio é uma repetição legítima e devolve o mesmo documento.
      if (isTerminalStatus(existing.status)) return existing;

      // Estado não terminal (SIGNED/SENT/PROCESSING/SYNC_REQUIRED — ver a
      // máquina de estados em data-model.md): a nota foi numerada e assinada
      // mas não chegou a um desfecho, tipicamente por falha de comunicação.
      // Retomar a transmissão do MESMO documento, sem reservar novo número —
      // devolver o estado intermediário como resposta final queimaria a chave
      // de idempotência por uma indisponibilidade momentânea da SEFAZ.
      return this.resumeTransmission(existing);
    }

    // Validação de completude ANTES de qualquer reserva/transmissão
    // (Acceptance Scenario 2, SC-004).
    validateNfeItems(dto.items, IssueNfeUseCase.name);

    // FR-008 — bloqueia emissão sem certificado válido e vigente.
    const certificate = await this.certificateRepository.findValidByCompanyId(
      company.id,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(IssueNfeUseCase.name, company.id);
    }

    const environment = dto.environment ?? company.defaultEnvironment;

    // ANTES de reservar numero: numeracao fiscal e sequencial e finita, e um
    // numero reservado sem uso vira salto que o fisco cobra explicacao. A
    // recusa de ambiente acontecia so na transmissao, entao cada tentativa mal
    // configurada queimava um numero e deixava um `SIGNED` orfao.
    this.providerFactory
      .getProvider('SEFAZ_BA_NFE')
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

    // Constrói + valida (FR-009) + assina (perfil legado exigido pela SEFAZ —
    // ver xml-signer.ts XmlSignatureAlgorithmProfile.NFE_SEFAZ) o XML.
    const { xml: unsignedXml, accessKey } = buildNfeXml({
      environment,
      // Escritorio de contabilidade do Emitente. A Bahia rejeita a nota sem
      // ele (486); vem do cadastro da empresa, nao da requisicao, porque o
      // contador serve o Emitente e nao a operacao.
      authorizedDownloadDocuments: company.accountingOfficeDocument
        ? [company.accountingOfficeDocument]
        : undefined,
      emitter: {
        cnpj: company.cnpj,
        legalName: company.legalName,
        stateRegistration: company.stateRegistration ?? '',
        taxRegimeCode: company.taxRegime === 'SIMPLES_NACIONAL' ? '1' : '3',
        address: {
          street: company.address.street,
          number: company.address.number,
          complement: company.address.complement,
          district: company.address.district,
          cityCodeIbge: company.cityCodeIbge,
          cityName: company.address.city,
          uf: company.uf,
          zipCode: company.address.zipCode,
        },
      },
      recipient: {
        document: customer.document,
        documentType: customer.documentType,
        name: customer.name,
        address: customer.address.cityCodeIbge
          ? {
              street: customer.address.street,
              number: customer.address.number,
              complement: customer.address.complement,
              district: customer.address.district,
              cityCodeIbge: customer.address.cityCodeIbge,
              cityName: customer.address.city,
              uf: customer.address.uf,
              zipCode: customer.address.zipCode ?? '',
            }
          : null,
      },
      series,
      number: String(sequence.currentNumber),
      operationNature: dto.operationNature,
      operationType: dto.operationType,
      destinationIndicator: dto.destinationIndicator ?? '1',
      finalConsumer: dto.finalConsumer,
      presenceIndicator: dto.presenceIndicator,
      items: dto.items.map(toNfeItemInput),
      paymentMethodCode: dto.paymentMethodCode,
      // spec erp/029 — um detPag por forma real de pagamento do pedido;
      // ausente/vazio mantém o caminho legado (detPag único de
      // paymentMethodCode), já coberto pelo builder.
      payments: dto.payments?.length
        ? dto.payments.map((payment) => ({
            method: payment.method,
            amount: payment.amount,
            description: payment.description,
          }))
        : undefined,
    });

    const { privateKeyPem, certificatePem } = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );

    const signedXml = signXml({
      xml: unsignedXml.toString(),
      privateKeyPem,
      certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    // FR-009: o schema oficial exige o elemento <Signature> como irmão de
    // <infNFe> — validar o XML *sem* assinatura sempre falha nesse ponto
    // específico. A validação real (e a que importa para não transmitir XML
    // inválido à SEFAZ) é contra o documento já assinado, antes do envio.
    assertValidXml(signedXml, NFE_XSD_PATH, IssueNfeUseCase.name);

    const now = new Date();
    const document = FiscalDocument.with(
      {
        companyId: company.id,
        customerId: customer.id,
        documentType: 'NFE',
        provider: 'SEFAZ_BA_NFE',
        environment,
        status: 'SIGNED',
        sourceSystem: dto.sourceSystem,
        externalReference: dto.externalReference,
        idempotencyKey: dto.idempotencyKey,
        series,
        number: String(sequence.currentNumber),
        rpsSeries: null,
        rpsNumber: null,
        accessKey,
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
            itemType: 'PRODUCT',
            ncm: item.ncm,
            cfop: item.cfop,
            cst: item.cst ?? null,
            csosn: item.csosn ?? null,
            serviceCode: null,
            taxJson: null,
          },
          randomUUID(),
        ),
      ),
    );

    // O documento precisa estar persistido ANTES da transmissão: o provider
    // recarrega o FiscalDocument por id para resolver o certificado do
    // Emitente (SefazBaNfeProvider.loadDocumentAndCertificate). Persistir em
    // SIGNED também é o que torna auditável o caso "assinei e numerei, mas a
    // SEFAZ não respondeu" — o número da FiscalSequence já foi consumido.
    await this.fiscalDocumentRepository.save(document);

    // Guardar o XML assinado antes de transmitir é o que torna a retomada
    // possível (D3): sem isso, uma falha de comunicação deixaria o documento
    // numerado sem nenhum vestígio do que foi assinado, e retomar exigiria
    // reconstruir e re-assinar — mudando a chave de acesso de uma nota que a
    // SEFAZ pode já ter recebido.
    await this.objectStorage.put({
      key: signedXmlObjectKey(company.id, document.id),
      buffer: Buffer.from(signedXml, 'utf-8'),
      mimeType: 'application/xml',
    });

    return this.transmitAndPersist(document, signedXml, environment);
  }

  /// Retoma a transmissão de um documento já numerado e assinado, relendo o
  /// XML assinado gravado antes da tentativa anterior.
  private async resumeTransmission(
    document: FiscalDocument,
  ): Promise<FiscalDocument> {
    const key = signedXmlObjectKey(document.companyId, document.id);

    // Documentos numerados antes desta mudança não têm XML assinado guardado,
    // e re-assinar produziria uma chave de acesso diferente para um número que
    // a SEFAZ pode já ter recebido. Falhar explicitamente é mais seguro do que
    // emitir uma segunda nota com a mesma numeração.
    if (!(await this.objectStorage.exists(key))) {
      throw new SignedXmlNotFoundError(IssueNfeUseCase.name, document.id);
    }

    const stored = await this.objectStorage.get(key);
    return this.transmitAndPersist(
      document,
      stored.buffer.toString('utf-8'),
      document.environment,
    );
  }

  private async transmitAndPersist(
    signedDocument: FiscalDocument,
    signedXml: string,
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): Promise<FiscalDocument> {
    let document = signedDocument;

    const provider = this.providerFactory.getProvider('SEFAZ_BA_NFE');
    const result = await provider.issue({
      fiscalDocumentId: document.id,
      environment,
      signedXml: Buffer.from(signedXml, 'utf-8'),
    });

    const archived = await archiveProviderExchange(this.objectStorage, {
      companyId: document.companyId,
      documentId: document.id,
      documentKind: 'nfe',
      operation: 'ISSUE',
      exchange: result,
    });

    await this.providerRequestRepository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: document.id,
          provider: 'SEFAZ_BA_NFE',
          operation: 'ISSUE',
          requestXmlObjectKey: archived.requestXmlObjectKey,
          responseXmlObjectKey: archived.responseXmlObjectKey,
          requestPayload: null,
          // FR-011 — desfecho retornado pelo órgão fiscal. Os envelopes SOAP
          // brutos correspondentes ficam arquivados no storage, referenciados
          // pelas chaves acima.
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
      const xmlObjectKey = `${document.companyId}/nfe/xml/${document.id}.xml`;
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
      documentType: 'NFE' as const,
      series,
      environment,
    };
    const existing = await this.fiscalSequenceRepository.findByKey(key);
    // Série desativada recusa a emissão com erro específico (spec erp/011, FR-006).
    // Criação sob demanda (existing null) continua com active:true (não-regressão).
    if (existing && !existing.active) {
      throw new SeriesInactiveError(IssueNfeUseCase.name, series);
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
    dto: IssueNfeDto['customer'],
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

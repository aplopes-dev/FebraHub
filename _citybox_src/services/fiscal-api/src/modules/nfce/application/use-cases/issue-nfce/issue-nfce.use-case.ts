import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import type { Company } from '../../../../companies/domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CompanyCscNotConfiguredError } from '../../../../companies/domain/errors/company-csc-not-configured.error';
import { readCompanyCsc } from '../../../../companies/infrastructure/csc/company-csc.reader';
import { CertificateRepository } from '../../../../certificates/domain/repositories/certificate.repository.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { ProviderRequestRepository } from '../../../../fiscal-documents/domain/repositories/provider-request.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../../../../fiscal-documents/domain/entities/fiscal-document-item.entity';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { SeriesInactiveError } from '../../../../fiscal-sequences/domain/errors/series-inactive.error';
import { ProviderRequest } from '../../../../fiscal-documents/domain/entities/provider-request.entity';
import { isTerminalStatus } from '../../../../fiscal-documents/domain/entities/fiscal-document-status';
import { archiveProviderExchange } from '../../../../fiscal-documents/application/archive-provider-exchange';
import { FiscalProviderFactory } from '../../../../providers/provider-factory';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { validateNfeItems } from '../../../../nfe/domain/validators/nfe-item.zod.validator';
import { toNfeItemInput } from '../../../../nfe/application/mappers/nfe-item-input.mapper';
import { CertificateNotValidError } from '../../../../nfe/domain/errors/certificate-not-valid.error';
import { SignedXmlNotFoundError } from '../../../../nfe/domain/errors/signed-xml-not-found.error';
import { loadCertificateKeyMaterial } from '../../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { signXml } from '../../../../../shared/infra/fiscal-signature/xml-signer';
import { assertValidXml } from '../../../../../shared/infra/fiscal-xml/xsd-validator';
import {
  buildNfeXml,
  type EmissionType,
} from '../../../../nfe/infrastructure/xml/nfe-xml.builder';
import { NFE_XSD_PATH } from '../../../../nfe/infrastructure/xml/nfe-xsd-path';
import { insertNfceSupplement } from '../../../infrastructure/xml/nfce-xml.builder';
import { buildNfceQrCode } from '../../../domain/qr-code';
import {
  buildNfcePayments,
  type NfcePayments,
} from '../../../domain/payment.entity';
import {
  consumerIdentificationLimitFor,
  requiresConsumerIdentification,
} from '../../../domain/rules/consumer-limit';
import { ConsumerIdentificationRequiredError } from '../../../domain/errors/consumer-identification-required.error';
import {
  NfceConsultationUrls,
  type NfceUrls,
} from '../../../domain/consultation-urls';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { ContingencyQueueRepository } from '../../../domain/contingency/contingency-queue.repository';

/// `DigestValue` da assinatura, exigido pelo QR Code de contingência.
///
/// Extraído por regex e não por DOM pelo mesmo motivo de
/// `insertNfceSupplement`: o XML já está assinado, e reserializá-lo por um
/// parser quebraria o digest que estamos justamente lendo.
function extractDigestValue(signedXml: string): string {
  const match = /<(?:\w+:)?DigestValue>([^<]*)<\/(?:\w+:)?DigestValue>/.exec(
    signedXml,
  );
  if (!match) {
    throw new Error(
      'XML assinado sem DigestValue — impossível montar o QR Code de contingência',
    );
  }
  return match[1];
}
import type { IssueNfceDto } from '../../dtos/nfce.dto';

const SERIES = '1';

function signedXmlObjectKey(companyId: string, documentId: string): string {
  return `${companyId}/nfce/signed/${documentId}.xml`;
}

/// US1 / FR-001 a FR-006 — emite um cupom fiscal eletrônico (NFC-e, modelo 65).
///
/// Espelha `IssueNfeUseCase` de propósito: mesma ordem de fases, mesmos
/// repositórios, mesma retomada por idempotência. As diferenças são só as que
/// a NFC-e exige, e cada uma está comentada no ponto em que aparece.
@Injectable()
export class IssueNfceUseCase implements IUseCase<
  IssueNfceDto,
  FiscalDocument
> {
  private readonly logger = new Logger(IssueNfceUseCase.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalSequenceRepository: FiscalSequenceRepository,
    private readonly providerRequestRepository: ProviderRequestRepository,
    private readonly providerFactory: FiscalProviderFactory,
    private readonly objectStorage: ObjectStorage,
    private readonly consultationUrls: NfceConsultationUrls,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
    private readonly contingencyQueue: ContingencyQueueRepository,
  ) {}

  async execute(dto: IssueNfceDto): Promise<FiscalDocument> {
    // ⚠️ Primeira coisa, antes de qualquer leitura: o `companyId` vem do header
    // `X-Company-Id`, ou seja, é **afirmação do chamador**. Quem decide é a
    // política, a partir do `sub` do JWT — ver `CompanyAccessPolicy`.
    //
    // Devolve `NotFound`, nunca `Forbidden`: um 403 confirmaria que o Emitente
    // existe, e para contribuinte alheio a existência já é informação.
    const notFound = () =>
      new CompanyNotFoundError(IssueNfceUseCase.name, dto.companyId);

    if (!(await this.companyAccessPolicy.canActFor(dto.companyId, dto.user))) {
      throw notFound();
    }

    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) throw notFound();

    const existing = await this.fiscalDocumentRepository.findByIdempotency({
      companyId: company.id,
      sourceSystem: dto.sourceSystem,
      externalReference: dto.externalReference,
      documentType: 'NFCE',
      idempotencyKey: dto.idempotencyKey,
    });
    if (existing) {
      if (isTerminalStatus(existing.status)) return existing;
      return this.resumeTransmission(existing);
    }

    // ─────────────────────────────────────────────────────────────────────
    // ⚠️ TODAS as recusas ficam ACIMA da reserva de numeração (FR-006).
    //
    // Não é organização estética. Numeração fiscal é sequencial e finita, e um
    // número reservado sem uso vira salto que exige **inutilização junto à
    // SEFAZ** — procedimento administrativo, não `DELETE`. Esta base já deixou
    // sete documentos órfãos por verificar o ambiente depois de reservar, uma
    // única vez.
    //
    // Acrescentar validação nova? Ela vai AQUI, nunca abaixo da linha.
    // ─────────────────────────────────────────────────────────────────────
    const environment = dto.environment ?? company.defaultEnvironment;

    validateNfeItems(dto.items, IssueNfceUseCase.name);

    // ─── 1. O que o CHAMADOR pode corrigir agora (422) ────────────────────
    //
    // ⚠️ Antes das dependências de cadastro, e isso mudou depois do primeiro
    // teste real: com o CSC ausente, um pagamento incoerente respondia
    // `424 CSC_NOT_CONFIGURED`. Quem integra corrigia o cadastro, tentava de
    // novo e só então descobria o erro de pagamento — dois ciclos para dois
    // problemas que dava para reportar de uma vez.
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );

    // FR-004 — acima do limite estadual a venda exige consumidor identificado.
    if (
      !dto.consumer &&
      requiresConsumerIdentification(company.uf, totalAmount)
    ) {
      throw new ConsumerIdentificationRequiredError(
        IssueNfceUseCase.name,
        totalAmount,
        consumerIdentificationLimitFor(company.uf),
        company.uf,
      );
    }

    // FR-005 — pagamento coerente com o total. Recusar aqui, e não depois: a
    // SEFAZ não confere a soma, então um cupom incoerente é autorizado e vira
    // divergência descoberta no fechamento do mês.
    const payments = buildNfcePayments(dto.payments, totalAmount);

    // ─── 2. O que exige ação ADMINISTRATIVA (424) ─────────────────────────
    const certificate = await this.certificateRepository.findValidByCompanyId(
      company.id,
    );
    if (!certificate?.isValidNow()) {
      throw new CertificateNotValidError(IssueNfceUseCase.name, company.id);
    }

    // Só NFC-e tem esta: sem CSC não há QR Code conferível, e o cupom sairia
    // autorizado e inconsultável pelo consumidor.
    if (!company.hasCsc()) {
      throw new CompanyCscNotConfiguredError(IssueNfceUseCase.name, company.id);
    }

    // A recusa de PRODUCTION vem do provider, que não tem endpoint de produção
    // configurado — 424 antes de numerar.
    this.providerFactory
      .getProvider('SEFAZ_BA_NFE')
      .assertEnvironmentAvailable(environment);

    // A URL de consulta é por UF e não tem padrão: emitir apontando para o
    // estado errado produz QR Code que leva a lugar nenhum.
    const urls = this.consultationUrls.forUf(company.uf, environment);

    // ───────────────────── daqui para baixo, número queimado ─────────────
    const sequence = await this.reserveNextNumber(company.id, environment);

    const { privateKeyPem, certificatePem } = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );

    const assemble = (emissionType: EmissionType) =>
      this.assemble({
        company,
        dto,
        environment,
        emissionType,
        number: String(sequence.currentNumber),
        totalAmount,
        payments,
        urls,
        privateKeyPem,
        certificatePem,
      });

    const { supplementedXml, accessKey } = assemble('1');

    // Validar DEPOIS do suplemento: é este XML que vai à SEFAZ, e validar o
    // anterior deixaria justamente a inserção fora da verificação.
    assertValidXml(supplementedXml, NFE_XSD_PATH, IssueNfceUseCase.name);

    const now = new Date();
    const document = FiscalDocument.with(
      {
        companyId: company.id,
        // Consumidor não identificado não vira `Customer`: criar um cadastro
        // vazio por venda de balcão poluiria a base com milhares de registros
        // sem identidade.
        customerId: null,
        documentType: 'NFCE',
        provider: 'SEFAZ_BA_NFE',
        environment,
        status: 'SIGNED',
        sourceSystem: dto.sourceSystem,
        externalReference: dto.externalReference,
        idempotencyKey: dto.idempotencyKey,
        series: SERIES,
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

    await this.fiscalDocumentRepository.save(document);

    // Guardar o XML **com o suplemento**: é ele que a retomada retransmite. Um
    // reenvio a partir do XML sem QR Code produziria cupom autorizado e
    // inconsultável — e só na retomada, que é o caminho raro.
    await this.objectStorage.put({
      key: signedXmlObjectKey(company.id, document.id),
      buffer: Buffer.from(supplementedXml, 'utf-8'),
      mimeType: 'application/xml',
    });

    // ⚠️ US3 / FR-010 — a venda **tem de fechar** mesmo com a SEFAZ fora.
    //
    // A sondagem é feita ANTES de transmitir de verdade, para não gastar a
    // numeração duas vezes: se o órgão está inalcançável, o cupom já nasce em
    // contingência, com a chave de `tpEmis=9`, e vai para a fila.
    if (await this.isSefazUnreachable(environment)) {
      // ⚠️ UMA chamada, não duas. `cNF` deriva do timestamp, então dois
      // `assemble('9')` produziriam XMLs com chaves diferentes — e persistir a
      // chave de um com o XML do outro daria um documento que aponta para algo
      // inexistente. Um teste de armazenamento pegou isso.
      const contingency = assemble('9');

      return this.issueAsContingency({
        document,
        supplementedXml: contingency.supplementedXml,
        accessKey: contingency.accessKey,
        companyId: company.id,
      });
    }

    return this.transmitAndPersist(document, supplementedXml, environment);
  }

  /// FR-010 — conclui a venda com o cupom em contingência.
  ///
  /// O documento fica em `SIGNED`: ele **existe**, foi impresso e entregue, mas
  /// ainda não tem protocolo. Marcá-lo como `AUTHORIZED` seria mentira — e a
  /// mentira só apareceria na conciliação.
  private async issueAsContingency(params: {
    document: FiscalDocument;
    supplementedXml: string;
    accessKey: string;
    companyId: string;
  }): Promise<FiscalDocument> {
    // A chave muda: `tpEmis` ocupa o dígito 35. Persistir a chave da emissão
    // normal deixaria o documento apontando para algo que nunca existirá na
    // SEFAZ.
    const contingent = FiscalDocument.with(
      { ...params.document.props, accessKey: params.accessKey },
      params.document.id,
    ).withItems(params.document.items);

    await this.fiscalDocumentRepository.save(contingent);

    // Sobrescreve o XML guardado: é o de contingência que o dreno vai
    // retransmitir, e é dele que sai o documento impresso com a faixa.
    await this.objectStorage.put({
      key: signedXmlObjectKey(params.companyId, contingent.id),
      buffer: Buffer.from(params.supplementedXml, 'utf-8'),
      mimeType: 'application/xml',
    });

    // Enfileirar é o passo que impede a pior falha da feature: um cupom
    // entregue ao consumidor e esquecido. A fila é persistente por isso.
    await this.contingencyQueue.enqueue({
      fiscalDocumentId: contingent.id,
      companyId: params.companyId,
      emittedAt: contingent.issuedAt ?? new Date(),
    });

    this.logger.warn(
      `Cupom ${contingent.id} emitido em CONTINGÊNCIA (SEFAZ inalcançável). ` +
        `Chave ${params.accessKey}. Aguardando transmissão posterior.`,
    );

    return contingent;
  }

  /// Sondagem barata de disponibilidade.
  ///
  /// ⚠️ Usa a **consulta de status do serviço**, não uma emissão de teste:
  /// emitir para sondar queimaria numeração. Qualquer exceção conta como
  /// inalcançável; uma resposta, mesmo negativa, conta como disponível — é a
  /// mesma distinção de `contingency-decision.ts`.
  private async isSefazUnreachable(
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ): Promise<boolean> {
    const provider = this.providerFactory.getProvider('SEFAZ_BA_NFE');
    if (!provider.checkServiceStatus) return false;

    try {
      return !(await provider.checkServiceStatus(environment));
    } catch {
      return true;
    }
  }

  /// Monta, assina e suplementa o XML do cupom para um dado tipo de emissão.
  ///
  /// ⚠️ **Existe porque a contingência não é "tentar de novo".** O `tpEmis`
  /// ocupa o dígito 35 da chave de acesso, então mudar de emissão normal para
  /// contingência exige **remontar e reassinar** — o documento passa a ter
  /// outra chave. Reaproveitar o XML já assinado só trocando um campo
  /// produziria chave e conteúdo divergentes, e a SEFAZ recusa a
  /// inconsistência.
  ///
  /// A numeração, essa sim, é a mesma: o número já foi reservado e a venda é a
  /// mesma.
  private assemble(params: {
    company: Company;
    dto: IssueNfceDto;
    environment: 'HOMOLOGATION' | 'PRODUCTION';
    emissionType: EmissionType;
    number: string;
    totalAmount: number;
    payments: NfcePayments;
    urls: NfceUrls;
    privateKeyPem: string;
    certificatePem: string;
  }): { supplementedXml: string; accessKey: string } {
    const { company, dto, environment, emissionType } = params;

    const { xml: unsignedXml, accessKey } = buildNfeXml({
      environment,
      model: '65',
      emissionType,
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
      // Venda a consumidor não identificado é o caso comum no balcão: o grupo
      // `dest` é OMITIDO, não emitido vazio (ver `buildDestXml`).
      recipient: dto.consumer
        ? {
            document: dto.consumer.document,
            documentType: dto.consumer.documentType,
            name: dto.consumer.name ?? 'CONSUMIDOR',
            address: null,
          }
        : undefined,
      series: SERIES,
      number: params.number,
      operationNature: dto.operationNature ?? 'VENDA AO CONSUMIDOR',
      operationType: '1',
      destinationIndicator: '1',
      // Cupom é sempre consumidor final, com atendimento presencial no
      // estabelecimento — é a definição do modelo 65, não uma opção do pedido.
      finalConsumer: true,
      presenceIndicator: '1',
      items: dto.items.map(toNfeItemInput),
      // Legado da NF-e; para o cupom o que vale é `payments` abaixo.
      paymentMethodCode: params.payments.details[0].method,
      payments: params.payments.details,
      changeAmount: params.payments.changeAmount,
    });

    const signedXml = signXml({
      xml: unsignedXml.toString(),
      privateKeyPem: params.privateKeyPem,
      certificatePem: params.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='NFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    // ⚠️ QR Code DEPOIS de assinar — ver research.md R2. Na contingência isso
    // deixa de ser preferência e vira obrigação: o conteúdo inclui o
    // `digVal`, que é o DigestValue da assinatura e não existe antes dela.
    const csc = readCompanyCsc(company);
    const { qrCode } = buildNfceQrCode({
      accessKey,
      environment,
      cscId: csc.cscId,
      cscToken: csc.cscToken,
      consultationUrl: params.urls.qrCode,
      offline:
        emissionType === '9'
          ? {
              emittedAt: new Date(),
              totalAmount: params.totalAmount,
              digestValue: extractDigestValue(signedXml),
            }
          : undefined,
    });

    return {
      supplementedXml: insertNfceSupplement(signedXml, {
        qrCode,
        urlChave: params.urls.accessKeyLookup,
      }),
      accessKey,
    };
  }

  private async resumeTransmission(
    document: FiscalDocument,
  ): Promise<FiscalDocument> {
    const key = signedXmlObjectKey(document.companyId, document.id);

    if (!(await this.objectStorage.exists(key))) {
      throw new SignedXmlNotFoundError(IssueNfceUseCase.name, document.id);
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
      documentKind: 'nfce',
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
      // ⚠️ O fallback guarda o XML **com suplemento** (é o que `signedXml`
      // carrega aqui): armazenar a versão sem QR Code deixaria a DANFCE e a
      // reimpressão sem o código, e o defeito só apareceria no papel.
      const xmlToStore =
        result.authorizedXml ?? Buffer.from(signedXml, 'utf-8');
      const xmlObjectKey = `${document.companyId}/nfce/xml/${document.id}.xml`;
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
    environment: 'HOMOLOGATION' | 'PRODUCTION',
  ) {
    // ⚠️ `documentType: 'NFCE'` é o que dá numeração ISOLADA da NF-e (FR-002).
    // `fiscal_sequences` é única por (company, documentType, series,
    // environment), então o tipo diferente cria sequência própria. Passar
    // 'NFE' aqui faria cupom e nota disputarem a mesma numeração — conflito na
    // SEFAZ, e descoberto tarde.
    const key = {
      companyId,
      documentType: 'NFCE' as const,
      series: SERIES,
      environment,
    };
    const existing = await this.fiscalSequenceRepository.findByKey(key);
    // Série desativada recusa a emissão com erro específico (spec erp/011, FR-006).
    if (existing && !existing.active) {
      throw new SeriesInactiveError(IssueNfceUseCase.name, SERIES);
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
}

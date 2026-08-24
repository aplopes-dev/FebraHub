import { Injectable, Logger } from '@nestjs/common';
import { CertificateRepository } from '../../../certificates/domain/repositories/certificate.repository.interface';
import { CompanyRepository } from '../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../companies/domain/errors/company-not-found.error';
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
import { loadCertificateKeyMaterial } from '../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { callSefazSoapOperation } from '../../../../shared/infra/fiscal-soap/sefaz-soap-client';
import { signXml } from '../../../../shared/infra/fiscal-signature/xml-signer';
import { CertificateNotValidError } from '../../../nfe/domain/errors/certificate-not-valid.error';
import {
  NFE_AUTORIZACAO_WSDL_PATH,
  NFE_CONSULTA_PROTOCOLO_WSDL_PATH,
  NFE_INUTILIZACAO_WSDL_PATH,
  NFE_RECEPCAO_EVENTO_WSDL_PATH,
  resolveSefazBaEndpoint,
  type SefazFiscalModel,
} from './sefaz-ba-config';
import {
  buildConsultaProtocoloXml,
  buildEnvEventoXml,
  buildEnviNfeXml,
  buildInutNfeXml,
  buildNfeEventXml,
  parseRetConsSitNfeXml,
  parseRetEnviNfeXml,
  parseRetEnvEventoXml,
  parseRetInutNfeXml,
  type NfeEventKind,
  type SefazEventResult,
  type SefazProtocolResult,
} from './nfe-soap-envelope';

const NFE_AUTORIZACAO_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4';
const NFE_CONSULTA_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4';
const NFE_RECEPCAO_EVENTO_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4';
const NFE_INUTILIZACAO_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4';

function buildLoteId(): string {
  return String(Date.now());
}

/// Converte o resultado do parser (que também modela `DENIED`, distinto de
/// uma rejeição comum) para `IssueDocumentResult`, cujo contrato (Strategy —
/// `FiscalProvider`, já usado por 3 casos de uso + testes) só tem
/// AUTHORIZED/REJECTED/SYNC_REQUIRED. `DENIED` vira REJECTED aqui — o
/// `errorCode` ("110") preserva a distinção para quem inspecionar o campo.
/// Ampliar o contrato para incluir DENIED nativamente é uma evolução futura
/// documentada em AGENTS.md, não feita agora para não alterar a interface
/// compartilhada fora do escopo de T038.
function toIssueResult(parsed: SefazProtocolResult): IssueDocumentResult {
  if (parsed.status === 'AUTHORIZED') {
    return {
      status: 'AUTHORIZED',
      protocol: parsed.protocol,
      accessKey: parsed.accessKey,
      authorizedXml: Buffer.from(parsed.authorizedXml, 'utf-8'),
    };
  }
  if (parsed.status === 'SYNC_REQUIRED') {
    return { status: 'SYNC_REQUIRED' };
  }
  return {
    status: 'REJECTED',
    errorCode: parsed.errorCode,
    errorMessage: parsed.errorMessage,
  };
}

/// `ConsultDocumentResult.status` é `string` (não uma union fechada) — aqui
/// preservamos DENIED fielmente, já que `ConsultNfeUseCase` grava o valor
/// direto como `FiscalDocument.status` (que inclui DENIED nativamente).
function toConsultResult(parsed: SefazProtocolResult): ConsultDocumentResult {
  if (parsed.status === 'AUTHORIZED') {
    return {
      status: 'AUTHORIZED',
      protocol: parsed.protocol,
      authorizedXml: Buffer.from(parsed.authorizedXml, 'utf-8'),
    };
  }
  if (parsed.status === 'SYNC_REQUIRED') {
    return { status: 'SYNC_REQUIRED' };
  }
  return { status: parsed.status, errorMessage: parsed.errorMessage };
}

/// `FiscalProvider` concreto (Strategy) para NF-e via SEFAZ-BA (T038) — usa o
/// cliente SOAP genérico (`fiscal-soap`, T039) + o envelope/parser
/// específico de NF-e (`nfe-soap-envelope.ts`). `cancel()`/`correctionLetter()`
/// (T063/T064/T068) transmitem eventos via `NFeRecepcaoEvento4`;
/// `inutilize()` (T065/T068) transmite via `NFeInutilizacao4` — diferente
/// dos demais métodos, não parte de um `FiscalDocument` existente (a faixa
/// nunca foi emitida), por isso carrega `companyId` diretamente e usa
/// `CompanyRepository` em vez de `loadDocumentAndCertificate`.
///
/// ATENÇÃO — ver cabeçalho de `resources/wsdl/nfe/*.wsdl`: o binding SOAP
/// (WSDL) é de autoria própria, não verificado contra o WSDL oficial (sem
/// acesso de rede a hnfe.sefaz.ba.gov.br neste ambiente de desenvolvimento).
/// Os endpoints em si (`sefaz-ba-config.ts`) foram confirmados pelo usuário.
/// O XML de evento/inutilização (`envEvento`/`evento`/`infEvento`,
/// `inutNFe`/`infInut`) também não foi verificado contra XSD oficial — ver
/// cabeçalho de `nfe-soap-envelope.ts`. Confirmar tudo antes do primeiro
/// teste real em homologação.
@Injectable()
export class SefazBaNfeProvider extends FiscalProvider {
  private readonly logger = new Logger(SefazBaNfeProvider.name);

  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly objectStorage: ObjectStorage,
  ) {
    super();
  }

  /// Modelo lido do **XML que está sendo enviado**, não recebido por parâmetro.
  ///
  /// ⚠️ É o que impede o defeito que a rejeição 702 revelou: destino e conteúdo
  /// divergirem. Um parâmetro poderia dizer `55` enquanto o XML diz `65`;
  /// derivando do próprio documento, o endereço acompanha o que de fato vai.
  private modelOf(signedXml: string): SefazFiscalModel {
    return /<(?:\w+:)?mod>\s*65\s*<\/(?:\w+:)?mod>/.test(signedXml)
      ? '65'
      : '55';
  }

  async issue(input: IssueDocumentInput): Promise<IssueDocumentResult> {
    const { privateKeyPem, certificatePem } =
      await this.loadDocumentAndCertificate(input.fiscalDocumentId);

    const signedNfeXml = input.signedXml.toString('utf-8');
    const requestBodyXml = buildEnviNfeXml({
      idLote: buildLoteId(),
      signedNfeXml,
    });

    this.logger.log(
      `Emitindo NF-e (fiscalDocumentId=${input.fiscalDocumentId}, ambiente=${input.environment})`,
    );

    const soapResult = await callSefazSoapOperation({
      wsdlPath: NFE_AUTORIZACAO_WSDL_PATH,
      endpoint: resolveSefazBaEndpoint(
        'NFeAutorizacao4',
        input.environment,
        // NFC-e vai para o SVRS, não para o autorizador da Bahia.
        this.modelOf(signedNfeXml),
      ),
      operation: 'nfeAutorizacaoLote',
      requestElementName: 'nfeDadosMsg',
      requestNamespace: NFE_AUTORIZACAO_NAMESPACE,
      requestBodyXml,
      responseWrapperLocalName: 'nfeResultMsg',
      privateKeyPem,
      certificatePem,
    });

    const parsed = parseRetEnviNfeXml(soapResult.responseBodyXml, signedNfeXml);
    return {
      ...toIssueResult(parsed),
      // FR-011 — o transporte já captura os envelopes; repassá-los é o que
      // permite ao caso de uso arquivar a conversa completa com a SEFAZ.
      rawRequestXml: soapResult.rawRequestXml ?? undefined,
      rawResponseXml: soapResult.rawResponseXml ?? undefined,
    };
  }

  async consult(input: ConsultDocumentInput): Promise<ConsultDocumentResult> {
    const { document, privateKeyPem, certificatePem } =
      await this.loadDocumentAndCertificate(input.fiscalDocumentId);

    const accessKey = input.accessKey ?? document.accessKey;
    if (!accessKey) {
      return {
        status: 'REJECTED',
        errorMessage:
          'Documento sem chave de acesso — não é possível consultar',
      };
    }

    const requestBodyXml = buildConsultaProtocoloXml({
      environment: document.environment,
      accessKey,
    });

    this.logger.log(
      `Consultando NF-e (fiscalDocumentId=${input.fiscalDocumentId}, chave=${accessKey})`,
    );

    const soapResult = await callSefazSoapOperation({
      wsdlPath: NFE_CONSULTA_PROTOCOLO_WSDL_PATH,
      endpoint: resolveSefazBaEndpoint(
        'NFeConsultaProtocolo4',
        document.environment,
      ),
      operation: 'nfeConsultaNF',
      requestElementName: 'nfeDadosMsg',
      requestNamespace: NFE_CONSULTA_NAMESPACE,
      requestBodyXml,
      responseWrapperLocalName: 'nfeResultMsg',
      privateKeyPem,
      certificatePem,
    });

    const parsed = parseRetConsSitNfeXml(soapResult.responseBodyXml);
    return toConsultResult(parsed);
  }

  /// T063/T068 — cancelamento sempre `nSeqEvento=1` (não há retransmissão
  /// com sequência crescente para cancelamento, diferente de carta de
  /// correção, que pode ter várias ao longo do tempo).
  /// Resolver o endpoint ja lanca quando o ambiente nao esta configurado; aqui
  /// so antecipamos a checagem para antes da reserva do numero.
  assertEnvironmentAvailable(environment: 'HOMOLOGATION' | 'PRODUCTION'): void {
    resolveSefazBaEndpoint('NFeAutorizacao4', environment);
  }

  async cancel(input: CancelDocumentInput): Promise<CancelDocumentResult> {
    const result = await this.sendNfeEvent({
      fiscalDocumentId: input.fiscalDocumentId,
      eventKind: 'CANCEL',
      sequence: 1,
      protocol: input.protocol,
      justification: input.justification,
    });

    if (result.status === 'AUTHORIZED') {
      return {
        status: 'CANCEL_AUTHORIZED',
        protocol: result.protocol,
        responseXml: Buffer.from(result.responseXml, 'utf-8'),
        rawRequestXml: result.rawRequestXml,
        rawResponseXml: result.rawResponseXml,
      };
    }
    return {
      status: 'CANCEL_REJECTED',
      errorMessage: result.errorMessage,
      rawRequestXml: result.rawRequestXml,
      rawResponseXml: result.rawResponseXml,
    };
  }

  /// T064/T068.
  async correctionLetter(
    input: CorrectionLetterInput,
  ): Promise<CorrectionLetterResult> {
    const result = await this.sendNfeEvent({
      fiscalDocumentId: input.fiscalDocumentId,
      eventKind: 'CORRECTION_LETTER',
      sequence: input.sequence,
      correctionText: input.correctionText,
    });

    if (result.status === 'AUTHORIZED') {
      return {
        status: 'CORRECTION_LETTER_AUTHORIZED',
        protocol: result.protocol,
        responseXml: Buffer.from(result.responseXml, 'utf-8'),
        rawRequestXml: result.rawRequestXml,
        rawResponseXml: result.rawResponseXml,
      };
    }
    return {
      status: 'REJECTED',
      errorMessage: result.errorMessage,
      rawRequestXml: result.rawRequestXml,
      rawResponseXml: result.rawResponseXml,
    };
  }

  /// Monta, assina (perfil `NFE_SEFAZ` — mesmo exigido para `infNFe`, ver
  /// `xml-signer.ts`) e transmite um evento (`envEvento`) via
  /// `NFeRecepcaoEvento4` — compartilhado por `cancel`/`correctionLetter`
  /// (T063/T064), único ponto que difere entre os dois é o conteúdo de
  /// `detEvento` (ver `buildNfeEventXml`).
  private async sendNfeEvent(input: {
    fiscalDocumentId: string;
    eventKind: NfeEventKind;
    sequence: number;
    protocol?: string;
    justification?: string;
    correctionText?: string;
  }): Promise<
    SefazEventResult & { rawRequestXml?: string; rawResponseXml?: string }
  > {
    const { document, certificate, privateKeyPem, certificatePem } =
      await this.loadDocumentAndCertificate(input.fiscalDocumentId);

    if (!document.accessKey) {
      return {
        status: 'REJECTED',
        errorCode: 'SEM_CHAVE_ACESSO',
        errorMessage:
          'Documento sem chave de acesso — não é possível transmitir evento',
      };
    }

    const { unsignedEventoXml } = buildNfeEventXml({
      eventKind: input.eventKind,
      environment: document.environment,
      accessKey: document.accessKey,
      cnpj: certificate.subjectCnpj,
      sequence: input.sequence,
      eventDateTime: new Date(),
      protocol: input.protocol,
      justification: input.justification,
      correctionText: input.correctionText,
    });

    const signedEventoXml = signXml({
      xml: unsignedEventoXml,
      privateKeyPem,
      certificatePem,
      referenceXPath: "//*[local-name(.)='infEvento']",
      signatureLocationXPath: "//*[local-name(.)='evento']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    const requestBodyXml = buildEnvEventoXml({
      idLote: buildLoteId(),
      signedEventoXml,
    });

    this.logger.log(
      `Transmitindo evento ${input.eventKind} (fiscalDocumentId=${input.fiscalDocumentId})`,
    );

    const soapResult = await callSefazSoapOperation({
      wsdlPath: NFE_RECEPCAO_EVENTO_WSDL_PATH,
      endpoint: resolveSefazBaEndpoint(
        'NFeRecepcaoEvento4',
        document.environment,
      ),
      operation: 'nfeRecepcaoEvento',
      requestElementName: 'nfeDadosMsg',
      requestNamespace: NFE_RECEPCAO_EVENTO_NAMESPACE,
      requestBodyXml,
      responseWrapperLocalName: 'nfeResultMsg',
      privateKeyPem,
      certificatePem,
    });

    return {
      ...parseRetEnvEventoXml(soapResult.responseBodyXml),
      // FR-011 — envelopes brutos repassados para o caso de uso arquivar.
      rawRequestXml: soapResult.rawRequestXml ?? undefined,
      rawResponseXml: soapResult.rawResponseXml ?? undefined,
    };
  }

  /// T065/T068 — sem `FiscalDocument` (número nunca emitido); carrega
  /// `Company`/`Certificate` diretamente por `companyId`.
  async inutilize(
    input: InutilizeDocumentInput,
  ): Promise<InutilizeDocumentResult> {
    const { company, privateKeyPem, certificatePem } =
      await this.loadCompanyAndCertificate(input.companyId);

    const { unsignedInutNfeXml } = buildInutNfeXml({
      environment: input.environment,
      cUF: company.cityCodeIbge.slice(0, 2),
      cnpj: company.cnpj,
      series: input.series,
      numberStart: input.numberStart,
      numberEnd: input.numberEnd,
      model: input.model,
      justification: input.justification,
      requestDateTime: new Date(),
    });

    const signedInutNfeXml = signXml({
      xml: unsignedInutNfeXml,
      privateKeyPem,
      certificatePem,
      referenceXPath: "//*[local-name(.)='infInut']",
      signatureLocationXPath: "//*[local-name(.)='inutNFe']",
      algorithmProfile: 'NFE_SEFAZ',
    });

    this.logger.log(
      `Inutilizando faixa (companyId=${input.companyId}, série=${input.series}, ${input.numberStart}-${input.numberEnd})`,
    );

    const soapResult = await callSefazSoapOperation({
      wsdlPath: NFE_INUTILIZACAO_WSDL_PATH,
      endpoint: resolveSefazBaEndpoint(
        'NFeInutilizacao4',
        input.environment,
        input.model,
      ),
      operation: 'nfeInutilizacaoNF',
      requestElementName: 'nfeDadosMsg',
      requestNamespace: NFE_INUTILIZACAO_NAMESPACE,
      requestBodyXml: signedInutNfeXml,
      responseWrapperLocalName: 'nfeResultMsg',
      privateKeyPem,
      certificatePem,
    });

    const parsed = parseRetInutNfeXml(soapResult.responseBodyXml);
    if (parsed.status === 'INUTILIZED') {
      return {
        status: 'INUTILIZED',
        protocol: parsed.protocol,
        responseXml: Buffer.from(parsed.responseXml, 'utf-8'),
        rawRequestXml: soapResult.rawRequestXml ?? undefined,
        rawResponseXml: soapResult.rawResponseXml ?? undefined,
      };
    }
    return {
      status: 'REJECTED',
      errorMessage: parsed.errorMessage,
      rawRequestXml: soapResult.rawRequestXml ?? undefined,
      rawResponseXml: soapResult.rawResponseXml ?? undefined,
    };
  }

  private async loadDocumentAndCertificate(fiscalDocumentId: string) {
    const document =
      await this.fiscalDocumentRepository.findById(fiscalDocumentId);
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        SefazBaNfeProvider.name,
        fiscalDocumentId,
      );
    }
    const certificate = await this.certificateRepository.findValidByCompanyId(
      document.companyId,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(
        SefazBaNfeProvider.name,
        document.companyId,
      );
    }
    const keyMaterial = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );
    return { document, certificate, ...keyMaterial };
  }

  private async loadCompanyAndCertificate(companyId: string) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundError(SefazBaNfeProvider.name, companyId);
    }
    const certificate =
      await this.certificateRepository.findValidByCompanyId(companyId);
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(SefazBaNfeProvider.name, companyId);
    }
    const keyMaterial = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );
    return { company, certificate, ...keyMaterial };
  }
}

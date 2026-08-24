import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../../companies/domain/repositories/company.repository.interface';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CertificateRepository } from '../../../../certificates/domain/repositories/certificate.repository.interface';
import { CertificateNotValidError } from '../../../../nfe/domain/errors/certificate-not-valid.error';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { NfseDocumentNotAuthorizedError } from '../../../domain/errors/nfse-document-not-authorized.error';
import { NfseSubstitutionNotAllowedError } from '../../../domain/errors/nfse-substitution-not-allowed.error';
import { resolveSubstitutionBlocker } from '../../../domain/rules/nfse-substitution-eligibility';
import { MunicipalParametersService } from '../../services/municipal-parameters.service';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { loadCertificateKeyMaterial } from '../../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { IssueNfseUseCase } from '../issue-nfse/issue-nfse.use-case';
import type { SubstituteNfseDto } from '../../dtos/nfse.dto';

const logger = new Logger('SubstituteNfseUseCase');

export type SubstituteNfseResult = {
  /// A nota original, agora cancelada por substituição.
  original: FiscalDocument;
  /// A nota nova, que assume o lugar.
  substitute: FiscalDocument;
};

/// Substituição de NFS-e (US3/FR-013): emite uma nota corrigida e registra o
/// evento `e105102` na original, preservando o vínculo entre as duas.
///
/// **Ordem deliberada: emitir a nova ANTES de registrar o evento.** O evento
/// exige `chSubstituta` — a chave da nota que assume o lugar — que só existe
/// depois da autorização. A ordem inversa é impossível, não uma preferência.
///
/// Consequência assumida: se a emissão der certo e o evento falhar, ficam duas
/// notas autorizadas para a mesma operação até alguém reprocessar. É o menor
/// dos males — o inverso (cancelar por substituição e a emissão falhar) deixaria
/// o serviço prestado sem nota nenhuma, que é infração fiscal.
@Injectable()
export class SubstituteNfseUseCase implements IUseCase<
  SubstituteNfseDto,
  SubstituteNfseResult
> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly certificateRepository: CertificateRepository,
    private readonly municipalParametersService: MunicipalParametersService,
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly issueNfse: IssueNfseUseCase,
  ) {}

  async execute(dto: SubstituteNfseDto): Promise<SubstituteNfseResult> {
    const original = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!original) {
      throw new FiscalDocumentNotFoundError(
        SubstituteNfseUseCase.name,
        dto.fiscalDocumentId,
      );
    }

    if (original.status !== 'AUTHORIZED' || !original.authorizedAt) {
      throw new NfseDocumentNotAuthorizedError(
        SubstituteNfseUseCase.name,
        original.id,
        original.status,
        'substitute',
      );
    }

    const company = await this.companyRepository.findById(original.companyId);
    if (!company) {
      throw new CompanyNotFoundError(
        SubstituteNfseUseCase.name,
        original.companyId,
      );
    }

    const certificate = await this.certificateRepository.findValidByCompanyId(
      company.id,
    );
    if (!certificate || !certificate.isValidNow()) {
      throw new CertificateNotValidError(
        SubstituteNfseUseCase.name,
        company.id,
      );
    }

    const { privateKeyPem, certificatePem } = await loadCertificateKeyMaterial(
      this.objectStorage,
      certificate,
    );

    const parameters = await this.municipalParametersService.resolve({
      cityCodeIbge: company.cityCodeIbge,
      environment: original.environment,
      privateKeyPem,
      certificatePem,
    });

    const now = new Date();
    // Elegibilidade ANTES de emitir a nota nova: emitir e só então descobrir
    // que a substituição não era permitida deixaria uma nota extra viva.
    const blocker = resolveSubstitutionBlocker({
      authorizedAt: original.authorizedAt,
      now,
      parameters,
      hasCustomerIdentification: original.customerId !== null,
      hasPendingFiscalAnalysis: await this.hasPendingFiscalAnalysis(
        original.id,
      ),
      hasOfficialBlock: dto.hasOfficialBlock ?? false,
    });
    if (blocker) {
      throw new NfseSubstitutionNotAllowedError(
        SubstituteNfseUseCase.name,
        original.id,
        blocker,
      );
    }

    // `chSubstda` exige a CHAVE da NFS-e (50 digitos). Antes do desfecho o
    // documento guarda o `Id` da DPS (prefixo "DPS"), que nao serve — o XML
    // sairia invalido por schema. Recusar aqui da erro legivel em vez de uma
    // falha de pattern que nao diz qual campo esta errado.
    const chaveOriginal = original.accessKey ?? '';
    if (!chaveOriginal || chaveOriginal.startsWith('DPS')) {
      throw new NfseSubstitutionNotAllowedError(
        SubstituteNfseUseCase.name,
        original.id,
        'MISSING_ACCESS_KEY',
      );
    }

    // `E0063`: a DPS de substituicao tem de manter competencia, tomador e
    // VALOR do servico da original — a substituicao corrige outros dados, nao o
    // valor. Verificado contra o servico real em 2026-08-07.
    //
    // Validar aqui, e nao deixar o orgao recusar, poupa uma numeracao fiscal e
    // devolve um erro que diz o que fazer.
    const totalSubstituta = dto.replacement.items.reduce(
      (soma, item) => soma + item.totalValue,
      0,
    );
    if (Math.abs(totalSubstituta - Number(original.totalAmount)) > 0.001) {
      throw new NfseSubstitutionNotAllowedError(
        SubstituteNfseUseCase.name,
        original.id,
        'VALUE_MISMATCH',
      );
    }

    // ⚠️ Substituicao e uma EMISSAO com bloco `subst`, nao um evento postado.
    // `POST /nfse/{chave}/eventos` recusa o `e105102` com `E1861` ("nao e
    // aceito pelo metodo POST da API Eventos") — verificado contra o servico
    // real em 2026-08-07. O Sefin gera o evento de cancelamento por
    // substituicao sozinho, a partir da DPS.
    //
    // Isso elimina a janela de "duas notas vivas": nao ha mais um segundo passo
    // que pode falhar depois da nota nova ja existir. Ou a DPS com `subst` e
    // autorizada — e o orgao cancela a original — ou nada acontece.
    const substitute = await this.issueNfse.execute({
      ...dto.replacement,
      substitution: {
        substitutedAccessKey: chaveOriginal,
        reasonCode: dto.reasonCode,
        reasonText: dto.reasonText,
      },
    });

    if (substitute.status !== 'AUTHORIZED') {
      logger.warn(
        `Substituicao nao concluida: a nota nova (${substitute.id}) nao foi ` +
          `autorizada (status=${substitute.status}). A original ` +
          `(${original.id}) permanece valida.`,
      );
      return { original, substitute };
    }

    // Registro local do vinculo. O evento em si e do orgao; aqui guardamos a
    // trilha que liga as duas notas para a linha do tempo e a auditoria.
    await this.fiscalEventRepository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: original.id,
          eventType: 'CANCEL',
          sequence: null,
          status: 'CANCEL_AUTHORIZED',
          justification: dto.reasonText ?? null,
          correctionText: null,
          protocol: substitute.protocol ?? null,
          requestXmlObjectKey: null,
          responseXmlObjectKey: null,
          nationalEventCode: 'e105102',
          generatorEnvironment: 2,
          replacedByDocumentId: substitute.id,
          createdAt: now,
          companyId: null,
          series: null,
          numberRangeStart: null,
          numberRangeEnd: null,
        },
        randomUUID(),
      ),
    );

    const updatedOriginal = await this.fiscalDocumentRepository.save(
      FiscalDocument.with(
        {
          ...original.props,
          status: 'CANCEL_AUTHORIZED',
          cancelledAt: now,
        },
        original.id,
      ).withItems(original.items),
    );

    return { original: updatedOriginal, substitute };
  }

  /// Pedido de análise fiscal registrado e ainda sem julgamento. `e101103` é o
  /// pedido; `e105104`/`e105105` são deferimento/indeferimento — enquanto só o
  /// primeiro existe, a decisão está pendente.
  private async hasPendingFiscalAnalysis(
    fiscalDocumentId: string,
  ): Promise<boolean> {
    const events =
      await this.fiscalEventRepository.findByFiscalDocumentId(fiscalDocumentId);
    const codes = new Set(
      events.map((event) => event.nationalEventCode).filter(Boolean),
    );
    return (
      codes.has('e101103') && !codes.has('e105104') && !codes.has('e105105')
    );
  }
}

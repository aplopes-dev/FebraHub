import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-event.repository.interface';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import type {
  FiscalDocument,
  FiscalDocumentType,
} from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AuxiliaryDocumentRenderer } from '../../../domain/renderer.interface';
import {
  WatermarkStamper,
  HOMOLOGATION_WATERMARK_TEXT,
} from '../../../domain/watermark.interface';
import { DocumentNotPrintableError } from '../../../domain/errors/document-not-printable.error';
import { AuthorizedXmlUnavailableError } from '../../../domain/errors/authorized-xml-unavailable.error';
import {
  isPrintable,
  isCancelledStatus,
} from '../../../domain/rules/printability';
import type {
  AuxiliaryDocument,
  DocumentOrigin,
} from '../../../domain/auxiliary-document.types';
import { OfficialDocumentSource } from '../../../domain/official-source.interface';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

export type GetAuxiliaryDocumentDto = {
  fiscalDocumentId: string;
  /// Emitente em nome de quem se solicita (FR-007).
  ///
  /// ⚠️ Vem do header `X-Company-Id`, ou seja: é **afirmação do chamador**, não
  /// fato. Sozinho não autoriza nada. Quem decide é a `CompanyAccessPolicy`, a
  /// partir do `user.sub` — ver `domain/company-access.policy.ts`.
  companyId: string;
  /// Solicitante autenticado. É a **única** entrada desta requisição que o
  /// chamador não pode forjar: vem do JWT verificado pelo `AuthGuard`.
  user: AuthenticatedUser;
  /// @default 'DEFAULT'
  format?: AuxiliaryDocumentFormat;
};

/// Formato pedido do documento auxiliar.
///
/// `DEFAULT` é o leiaute próprio de cada tipo — A4 para NF-e e NFS-e, **bobina**
/// para o cupom. `A4` só muda alguma coisa na NFC-e (FR-007a); nos outros ele
/// é o mesmo documento, e mapear os dois para o mesmo renderizador é a forma
/// honesta de dizer isso.
export const AUXILIARY_DOCUMENT_FORMATS = ['DEFAULT', 'A4'] as const;
export type AuxiliaryDocumentFormat =
  (typeof AUXILIARY_DOCUMENT_FORMATS)[number];

/// Um renderizador por (tipo, formato). Mapa explícito em vez de `if`, para
/// que acrescentar um tipo ou formato novo seja uma entrada de configuração e
/// não uma ramificação a mais aqui dentro.
///
/// `Record` aninhado, e não parcial: uma combinação sem entrada viraria
/// `undefined.render(...)` — um 500 sem explicação. Sendo total, a falta vira
/// erro de compilação.
export type RendererRegistry = Record<
  FiscalDocumentType,
  Record<AuxiliaryDocumentFormat, AuxiliaryDocumentRenderer>
>;

/// Fonte oficial por tipo de documento. Total, e não parcial, pelo mesmo
/// motivo do registro de renderizadores: um tipo sem entrada viraria
/// `undefined.fetch(...)` — um 500 sem explicação.
///
/// Para `NFE` a entrada é sempre `NoOfficialSource`: a SEFAZ **não fornece**
/// DANFE pronto, o emitente é quem gera. Não é lacuna a preencher depois.
export type OfficialSourceRegistry = Record<
  FiscalDocumentType,
  OfficialDocumentSource
>;

/// Tokens de injeção dos mapas. Necessários porque `Record<...>` é tipo, e tipo
/// não sobrevive à compilação para servir de token do Nest.
export const RENDERER_REGISTRY = Symbol('RENDERER_REGISTRY');
export const OFFICIAL_SOURCE_REGISTRY = Symbol('OFFICIAL_SOURCE_REGISTRY');

/// ⚠️ Terceiro **espelho manual** de `DocumentType` — os outros são o enum
/// Postgres e `DOCUMENT_TYPES` no domínio. Sendo um `Record` total, este é o
/// único dos três que o compilador protege: acrescentar um tipo sem entrada
/// aqui é erro de tipo.
const FILE_PREFIX: Record<FiscalDocumentType, string> = {
  NFE: 'DANFE',
  NFSE: 'DANFSE',
  NFCE: 'DANFCE',
};

/// FR-001 a FR-010 — entrega o documento auxiliar de uma nota autorizada.
///
/// A ordem das verificações não é arbitrária: emitente → estado → XML. Checar o
/// emitente **antes** de tocar no storage evita que a existência do arquivo de
/// outro contribuinte seja observável pelo tempo de resposta ou por um erro
/// diferente.
@Injectable()
export class GetAuxiliaryDocumentUseCase implements IUseCase<
  GetAuxiliaryDocumentDto,
  AuxiliaryDocument
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly renderers: RendererRegistry,
    private readonly watermarkStamper: WatermarkStamper,
    private readonly officialSources: OfficialSourceRegistry,
    private readonly fiscalEventRepository: FiscalEventRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(dto: GetAuxiliaryDocumentDto): Promise<AuxiliaryDocument> {
    const document = await this.findOwnedDocument(dto);

    if (!isPrintable(document.status)) {
      throw new DocumentNotPrintableError(
        GetAuxiliaryDocumentUseCase.name,
        document.id,
        document.status,
      );
    }

    const { rendered, origin } = await this.produce(
      document,
      dto.format ?? 'DEFAULT',
    );

    // FR-014 (spec 029) — a marca do Citybox (logo + legenda) foi REMOVIDA de
    // DANFE e DANFSE: documento fiscal padronizado não exibe marca de
    // fornecedor concorrendo com a identidade visual nacional da NT 008/2026.
    // Isto reverte a FR-011..FR-014 da spec 004; o estágio `BrandStamper` deixou
    // de existir. A marca d'água de homologação abaixo é um estágio SEPARADO e
    // permanece.

    // FR-005 — a marca d'água é condicional ao ambiente: o aviso de "sem valor
    // fiscal" vai por cima do documento. Aplicada independentemente da origem —
    // o documento vindo do órgão precisa sair marcado igual.
    const isFiscallyValid = document.environment === 'PRODUCTION';
    const content = isFiscallyValid
      ? rendered
      : await this.watermarkStamper.stamp(
          rendered,
          HOMOLOGATION_WATERMARK_TEXT,
        );

    return {
      content,
      mimeType: 'application/pdf',
      fileName: `${FILE_PREFIX[document.documentType]}-${document.accessKey ?? document.id}.pdf`,
      origin,
      isFiscallyValid,
    };
  }

  /// FR-002a — a fonte oficial vence quando responde, porque é a de maior
  /// autoridade; sua indisponibilidade não impede a entrega.
  ///
  /// A ordem importa: consultar o órgão **antes** de carregar o XML evita
  /// buscar do storage um arquivo que não seria usado. Quando o órgão não
  /// responde — o caso de hoje, com `501` em homologação —, o custo é só o
  /// timeout curto do cliente.
  private async produce(
    document: FiscalDocument,
    format: AuxiliaryDocumentFormat,
  ): Promise<{ rendered: Buffer; origin: DocumentOrigin }> {
    const official =
      await this.officialSources[document.documentType].fetch(document);

    if (official) return { rendered: official, origin: 'OFFICIAL_API' };

    const authorizedXml = await this.loadAuthorizedXml(document);
    const substitutedBy = await this.findSubstituteAccessKey(document);

    const rendered = await this.renderers[document.documentType][format].render(
      {
        authorizedXml,
        // Substituída não é o mesmo que cancelada. Ver `findSubstituteAccessKey`.
        isCancelled: isCancelledStatus(document.status) && !substitutedBy,
        substitutedBy,
      },
    );

    return { rendered, origin: 'LOCAL' };
  }

  /// FR-006, segunda metade — "o de nota substituída DEVE indicar a
  /// substituição e **identificar a nota substituta**".
  ///
  /// ⚠️ Existe porque `CANCEL_AUTHORIZED` é ambíguo: o Padrão Nacional cancela
  /// a original ao aceitar a substituta, então uma nota substituída e uma nota
  /// simplesmente cancelada terminam **no mesmo status**. Sem consultar o
  /// evento, o documento da nota substituída sairia dizendo apenas "NOTA
  /// CANCELADA" — verdadeiro, mas inútil: quem recebe não tem como chegar à
  /// nota que vale.
  ///
  /// O vínculo vive em `FiscalEvent.replacedByDocumentId`, gravado por
  /// `SubstituteNfseUseCase` junto do código nacional `e105102`.
  private async findSubstituteAccessKey(
    document: FiscalDocument,
  ): Promise<string | undefined> {
    if (!isCancelledStatus(document.status)) return undefined;

    const events = await this.fiscalEventRepository.findByFiscalDocumentId(
      document.id,
    );
    const substitution = events.find(
      (event) => event.replacedByDocumentId !== null,
    );
    if (!substitution?.replacedByDocumentId) return undefined;

    const substitute = await this.fiscalDocumentRepository.findById(
      substitution.replacedByDocumentId,
    );
    return substitute?.accessKey ?? undefined;
  }

  /// FR-007 — duas barreiras, e a ordem importa.
  ///
  /// 1. **O solicitante pode agir por este Emitente?** Decidido pela política,
  ///    a partir do `sub` do JWT. É a barreira que vale contra ataque: sem ela,
  ///    o passo 2 compararia o banco contra um header que o atacante escolheu.
  /// 2. **A nota é deste Emitente?** Compara `document.companyId`. Impede que
  ///    um usuário legítimo alcance nota de outra empresa.
  ///
  /// Ambas devolvem `NotFound`, **nunca `Forbidden`**: um 403 confirmaria que a
  /// nota existe, e para documento fiscal de outro contribuinte a existência já
  /// é informação. Também mantém as duas falhas indistinguíveis de fora — quem
  /// sonda não aprende se errou o emitente ou o id.
  private async findOwnedDocument(
    dto: GetAuxiliaryDocumentDto,
  ): Promise<FiscalDocument> {
    const notFound = () =>
      new FiscalDocumentNotFoundError(
        GetAuxiliaryDocumentUseCase.name,
        dto.fiscalDocumentId,
      );

    const mayAct = await this.companyAccessPolicy.canActFor(
      dto.companyId,
      dto.user,
    );
    if (!mayAct) throw notFound();

    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document || document.companyId !== dto.companyId) throw notFound();

    return document;
  }

  /// FR-010 — falha alto. **Não** existe caminho alternativo por design: montar
  /// o documento com os dados relacionais produziria um papel que diverge do
  /// que o fisco tem, e ninguém perceberia.
  private async loadAuthorizedXml(document: FiscalDocument): Promise<Buffer> {
    if (!document.xmlObjectKey) {
      throw new AuthorizedXmlUnavailableError(
        GetAuxiliaryDocumentUseCase.name,
        document.id,
        'document has no stored XML key',
      );
    }

    try {
      const stored = await this.objectStorage.get(document.xmlObjectKey);
      return stored.buffer;
    } catch (error: unknown) {
      throw new AuthorizedXmlUnavailableError(
        GetAuxiliaryDocumentUseCase.name,
        document.id,
        error instanceof Error ? error.message : 'unknown storage failure',
      );
    }
  }
}

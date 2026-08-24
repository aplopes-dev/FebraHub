import type {
  FiscalDocument,
  FiscalDocumentType,
} from '../entities/fiscal-document.entity';

export type ListFiscalDocumentsCriteria = {
  skip: number;
  take: number;
  companyId: string;
  documentType?: FiscalDocumentType;
  status?: string;
  sourceSystem?: string;
  externalReference?: string;
  issuedFrom?: Date;
  issuedTo?: Date;
  /// Não exposto no filtro público de `GET /fiscal-documents` (fora do
  /// contrato) — usado internamente por `InutilizeNfeUseCase` (T065) para
  /// checar sobreposição de faixa dentro de uma série específica.
  series?: string;
  /// Busca livre por `number`/`series` (spec `009-facilita-nfe-screen`, FR-005).
  search?: string;
};

/// Contagens por status para os cards de totais da tela Facilita NFE
/// (spec `009-facilita-nfe-screen`, FR-003). Não inclui `manifestedFinal`/
/// `unmanifested` — esses dois cards não têm equivalente no domínio de
/// documento emitido (research.md §3.3 dessa spec).
export type FiscalDocumentStatusCounts = {
  total: number;
  authorized: number;
  cancelled: number;
};

export type IdempotencyLookup = {
  /// Escopo obrigatorio: a chave e do ERP, nao nossa, e sem a empresa duas
  /// delas com a mesma chave colidiriam entre si.
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  documentType: FiscalDocumentType;
  idempotencyKey: string;
};

export abstract class FiscalDocumentRepository {
  /// Retorna o documento com seus itens já carregados (FR-003, contracts
  /// GET /fiscal-documents/{id}).
  abstract findById(id: string): Promise<FiscalDocument | null>;
  /// Idempotência (FR-013, SC-007) — usado pelos use-cases de emissão (US1/US2).
  abstract findByIdempotency(
    lookup: IdempotencyLookup,
  ): Promise<FiscalDocument | null>;
  abstract findAll(
    criteria: ListFiscalDocumentsCriteria,
  ): Promise<FiscalDocument[]>;
  abstract count(
    criteria: Omit<ListFiscalDocumentsCriteria, 'skip' | 'take'>,
  ): Promise<number>;
  /// Persistência completa (emissão em US1/US2) — não usada por nenhum
  /// use-case deste Foundational, definida agora para não precisar reabrir
  /// a interface quando US1/US2 chegarem.
  abstract save(document: FiscalDocument): Promise<FiscalDocument>;
}

import type {
  FinancialEntry,
  FinancialEntryOperation,
  FinancialEntryStatus,
} from '../entities/financial-entry.entity';

export const FINANCIAL_ENTRY_LIST_TABS = ['active', 'deleted'] as const;
export type FinancialEntryListTab = (typeof FINANCIAL_ENTRY_LIST_TABS)[number];

export const FINANCIAL_ENTRY_SORT_OPTIONS = [
  'due_date_asc',
  'due_date_desc',
  'amount_asc',
  'amount_desc',
  'created_at_desc',
] as const;
export type FinancialEntrySortOption =
  (typeof FINANCIAL_ENTRY_SORT_OPTIONS)[number];

export type FinancialEntryListCriteria = {
  operation?: FinancialEntryOperation;
  status?: FinancialEntryStatus[];
  /** Lançamento tem ao menos uma `allocation` numa dessas contas. */
  chartOfAccountId?: string[];
  /** Lançamento tem ao menos uma `allocation` num desses centros de custo. */
  costCenterId?: string[];
  /** Busca na descrição **ou** no nome da parte (cliente/fornecedor). */
  search?: string;
  /** Recorte sobre o vencimento — é por ele que o caixa é conferido. */
  dueFrom?: Date;
  dueTo?: Date;
  /** Recorte sobre a competência — eixo alternativo ao vencimento (extrato). */
  competenceFrom?: Date;
  competenceTo?: Date;
  /** Lançamento vinculado exatamente a essa conta bancária. */
  bankAccountId?: string;
  /** Cliente da parte — mutuamente exclusivo com `supplierId` no domínio. */
  customerId?: string;
  /** Fornecedor da parte (`006-bank-reconciliation` FR-038, research.md D17). */
  supplierId?: string;
  /**
   * Recorte sobre a data de pagamento/recebimento (`payments[].paidAt`) —
   * "Recebimento/Pagamento" do FR-038. Diferente de `dueFrom`/`competenceFrom`,
   * filtra pela relação `payments`, não por uma coluna do próprio lançamento.
   */
  paidFrom?: Date;
  paidTo?: Date;
  /** Lançamento tem ao menos um pagamento nessa forma (`006-bank-reconciliation` FR-038). */
  paymentMethod?: string;
  /** Lançamento tem ao menos um pagamento com essa bandeira (FR-038). */
  cardBrand?: string;
  sort?: FinancialEntrySortOption;
  /**
   * Aba da listagem. `active` (padrão) traz os não excluídos; `deleted`, só os
   * excluídos. Um booleano `includeDeleted` não daria conta: a aba "Excluídos"
   * precisa dos excluídos **sozinhos**, não somados aos ativos.
   */
  tab?: FinancialEntryListTab;
  skip?: number;
  take?: number;
};

export type FinancialEntryTabCounts = Record<FinancialEntryListTab, number>;

/**
 * Critério de elegibilidade para conciliação bancária
 * (`006-bank-reconciliation`, research.md D8): mesma conta, sinal compatível
 * e vencimento dentro da janela de datas em torno da transação do extrato.
 * `status: 'pending'` já é aplicado implicitamente — só lançamentos com
 * saldo em aberto entram no resultado (D7: nunca há conciliação parcial
 * nesta feature, então `status='pending'` já exclui os já conciliados sem
 * precisar de anti-join com `BankStatementMatch`).
 */
export type ReconciliationCandidateCriteria = {
  /** `undefined` quando a transação do extrato não tem conta resolvida
   *  (007-financeiro-ajustes-ui FR-007) — busca candidatos na organização
   *  inteira em vez de restringir a uma conta. */
  bankAccountId?: string;
  operation: FinancialEntryOperation;
  dueDateFrom: Date;
  dueDateTo: Date;
};

export type FinancialEntryReconciliationCandidate = {
  financialEntryId: string;
  /** `amountCents - paidCents` no momento da consulta. */
  openBalanceCents: number;
  dueDate: Date;
  description: string;
};

export abstract class FinancialEntryRepository {
  /** Devolve também o excluído — a aba "Excluídos" leva até o detalhe dele. */
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<FinancialEntry | null>;

  abstract findAll(
    organizationId: string,
    criteria?: FinancialEntryListCriteria,
  ): Promise<FinancialEntry[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores das abas — ignoram busca, operação, status e período de propósito. */
  abstract countByTabs(
    organizationId: string,
  ): Promise<FinancialEntryTabCounts>;

  /**
   * Grava o lançamento e substitui por completo suas linhas de pagamento e de
   * rateio, numa única transação (padrão `SaleOrder.lines`/`.payments`).
   */
  abstract save(entry: FinancialEntry): Promise<FinancialEntry>;

  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;

  /**
   * Soma `amountCents` por `operation`, sobre o mesmo conjunto de filtros da
   * listagem (`FinancialEntryListCriteria`, sem `skip`/`take`) — usada pelos
   * cards de resumo do extrato (entradas/saídas). Sempre agregada no banco
   * (`groupBy`), nunca `findAll` + soma em memória.
   */
  abstract sumAmountsByOperation(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<{ operation: FinancialEntryOperation; totalCents: number }[]>;

  /** Candidatos elegíveis para sugestão automática de conciliação bancária
   *  (`006-bank-reconciliation`) — ver `ReconciliationCandidateCriteria`. */
  abstract findReconciliationCandidates(
    organizationId: string,
    criteria: ReconciliationCandidateCriteria,
  ): Promise<FinancialEntryReconciliationCandidate[]>;
}

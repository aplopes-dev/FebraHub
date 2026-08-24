export type BankStatementStatus = "not_reconciled" | "partially_reconciled" | "reconciled";

export type BankStatementCounts = {
  pending: number;
  reconciled: number;
  discarded: number;
};

export type BankStatement = {
  id: string;
  bankAccountId: string;
  bankName: string;
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  /** ISO date `yyyy-MM-dd`. */
  periodStart: string;
  /** ISO date `yyyy-MM-dd`. */
  periodEnd: string;
  status: BankStatementStatus;
  counts: BankStatementCounts;
  fileName: string;
  createdAt: string;
};

export type BankStatementListItem = BankStatement;

export type BankStatementListParams = {
  page: number;
  perPage: number;
  bankAccountId?: string;
  status?: BankStatementStatus;
};

export type BankStatementListResult = {
  data: BankStatementListItem[];
  meta: { total: number; page: number; perPage: number };
};

export type ImportBankStatementResult = {
  data: BankStatement;
  meta: { totalInFile: number; imported: number; skippedDuplicates: number };
};

export type BankStatementTransactionStatus = "pending" | "reconciled" | "discarded";
export type BankStatementTransactionKind = "credit" | "debit";

export type BankStatementTransactionMatch = {
  financialEntryId: string;
  amountCents: number;
};

export type BankStatementTransaction = {
  id: string;
  /** ISO date `yyyy-MM-dd`. */
  postedAt: string;
  /** Reais — sempre positivo, o sinal vem de `kind`. */
  amount: number;
  kind: BankStatementTransactionKind;
  transactionType: string;
  memo: string;
  status: BankStatementTransactionStatus;
  matches: BankStatementTransactionMatch[];
};

export type BankStatementTransactionListParams = {
  page: number;
  perPage: number;
  status: BankStatementTransactionStatus;
  search: string;
  /** Filtro de período sobre `postedAt` (FR-035, research.md D15) — ISO
   *  `yyyy-MM-dd`. Rótulo na UI é "Período", nunca "vencimento". */
  postedFrom?: string;
  postedTo?: string;
};

export type BankStatementTransactionListResult = {
  data: BankStatementTransaction[];
  meta: { total: number; page: number; perPage: number };
};

export type MatchCandidate = {
  financialEntryId: string;
  /** Reais — saldo em aberto do lançamento no momento da consulta. */
  openBalance: number;
  /** ISO date `yyyy-MM-dd`. */
  dueDate: string;
  description: string;
  confidence: number;
};

export type MatchSuggestionResult =
  | { kind: "exact"; candidates: MatchCandidate[] }
  | { kind: "value_divergence"; candidates: MatchCandidate[] }
  | { kind: "none"; candidates: MatchCandidate[] };

/** "Buscar pelas datas de" (FR-038) — não exclusivas entre si. */
export type EligibleEntryPeriodType = "competence" | "due" | "paid";

/** Resultado da busca manual/soma unificada (US3/US4, FR-016/017/036/038,
 *  research.md D16/D17) — substitui `FinancialEntrySearchResult`. Inclui
 *  lançamentos `pending` e `paid` sem vínculo ativo (D16); `eligibleAmount`
 *  é o saldo em aberto (`pending`) ou o valor total (`paid`). */
export type EligibleEntry = {
  financialEntryId: string;
  status: "pending" | "paid";
  /** Reais. */
  eligibleAmount: number;
  /** ISO date `yyyy-MM-dd`. */
  dueDate: string;
  /** ISO date `yyyy-MM-dd`. */
  competenceDate: string;
  /** ISO date `yyyy-MM-dd`, ou `null` se nunca pago. */
  paidAt: string | null;
  description: string;
  categoryName: string;
};

/** Filtros do drawer "Buscar Registros" (FR-038) — sem `bankAccountId`,
 *  sempre travado no servidor na conta do extrato (FR-037). */
export type EligibleEntrySearchFilters = {
  search?: string;
  /** ISO date `yyyy-MM-dd`. */
  periodFrom?: string;
  /** ISO date `yyyy-MM-dd`. */
  periodTo?: string;
  periodType?: EligibleEntryPeriodType[];
  chartOfAccountId?: string;
  customerId?: string;
  supplierId?: string;
  paymentMethod?: string;
  cardBrand?: string;
};

export type EligibleEntrySearchResult = {
  data: EligibleEntry[];
  meta: { total: number; page: number; perPage: number };
};

export type CreateEntryFromTransactionInput = {
  description: string;
  partyName: string;
  /** Spec erp/031 D2 — mutuamente exclusivo com `supplierId`. */
  customerId: string | null;
  /** Spec erp/031 D2 — mutuamente exclusivo com `customerId`. */
  supplierId: string | null;
  categoryName: string;
  note: string;
  /** Editável (research.md D14) — pré-preenchido com a conta do extrato. */
  bankAccountId: string;
  chartOfAccountId: string;
  costCenterId: string;
};

import type {
  FinancialEntryOperation,
  FinancialEntryStatus,
} from "@/features/financial-entries/types/financial-entry";

export type { FinancialEntryOperation, FinancialEntryStatus };

/** Qual data usar para o filtro de período — competência ou vencimento (FR-004/FR-015). */
export type FinancialStatementDateAxis = "competence" | "due";

export type FinancialStatementFilters = {
  operations: FinancialEntryOperation[];
  statuses: FinancialEntryStatus[];
  categoryIds: string[];
  costCenterIds: string[];
  bankAccountId: string | null;
  dateAxis: FinancialStatementDateAxis;
  /** ISO date `yyyy-MM-dd`, inclusive. */
  dateFrom: string | null;
  /** ISO date `yyyy-MM-dd`, inclusive. */
  dateTo: string | null;
};

export type FinancialStatementListParams = {
  search: string;
  filters: FinancialStatementFilters;
  page: number;
  perPage: number;
};

/** Cards de resumo (FR-008) — reais, já convertidos de centavos. */
export type FinancialStatementSummary = {
  receivable: number;
  payable: number;
  net: number;
};

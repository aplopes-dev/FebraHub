import type { FinancialEntryStatus } from '../../../financial-entries/domain/entities/financial-entry.entity';

/** "Buscar pelas datas de" — checkboxes do FR-038, não exclusivo entre si. */
export const ELIGIBLE_ENTRY_PERIOD_TYPES = [
  'competence',
  'due',
  'paid',
] as const;
export type EligibleEntryPeriodType =
  (typeof ELIGIBLE_ENTRY_PERIOD_TYPES)[number];

/**
 * FR-016/036/037/038, research.md D17 — busca manual/soma unificada.
 * `bankAccountId` não é aceito aqui: sempre resolvido a partir do extrato
 * (FR-037, travado no servidor).
 */
export type SearchEligibleEntriesDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
  search?: string;
  periodFrom?: Date;
  periodTo?: Date;
  /** Ausente = aplica o intervalo às três datas (competência/vencimento/pagamento). */
  periodType?: EligibleEntryPeriodType[];
  chartOfAccountId?: string;
  customerId?: string;
  supplierId?: string;
  paymentMethod?: string;
  cardBrand?: string;
  page: number;
  perPage: number;
};

export type EligibleEntryResult = {
  financialEntryId: string;
  status: FinancialEntryStatus;
  /** D16 — saldo em aberto (`pending`) ou `amountCents` total (`paid`). */
  eligibleAmountCents: number;
  dueDate: Date;
  competenceDate: Date;
  paidAt: Date | null;
  description: string;
  categoryName: string;
};

export type SearchEligibleEntriesResult = {
  data: EligibleEntryResult[];
  total: number;
};

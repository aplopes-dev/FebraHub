import type {
  FinancialEntryOperation,
  FinancialEntryStatus,
} from '../../domain/entities/financial-entry.entity';

export type GetFinancialEntriesSummaryInput = {
  organizationId: string;
  operation?: FinancialEntryOperation;
  status?: FinancialEntryStatus[];
  chartOfAccountId?: string[];
  costCenterId?: string[];
  bankAccountId?: string;
  search?: string;
  dueFrom?: Date;
  dueTo?: Date;
  competenceFrom?: Date;
  competenceTo?: Date;
};

export type FinancialEntriesSummaryDto = {
  receivableCents: number;
  payableCents: number;
  netCents: number;
};

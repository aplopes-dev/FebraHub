import type {
  FinancialEntry,
  FinancialEntryOperation,
  FinancialEntryStatus,
} from '../../domain/entities/financial-entry.entity';
import type {
  FinancialEntryListTab,
  FinancialEntrySortOption,
  FinancialEntryTabCounts,
} from '../../domain/repositories/financial-entry.repository.interface';

export type FinancialEntryPaymentWritableDto = {
  id?: string;
  amountCents: number;
  paidAt: Date;
  paymentMethod: string;
  cardBrand?: string | null;
};

export type FinancialEntryAllocationWritableDto = {
  id?: string;
  chartOfAccountId: string;
  costCenterId: string;
  amountCents: number;
  percentage: number;
};

export type FinancialEntryWritableDto = {
  operation: FinancialEntryOperation;
  description?: string;
  amountCents: number;
  feesCents?: number;
  finesCents?: number;
  competenceDate: Date;
  dueDate: Date;
  partyName?: string;
  customerId?: string | null;
  supplierId?: string | null;
  bankAccountId?: string | null;
  categoryName?: string;
  note?: string;
  payments?: FinancialEntryPaymentWritableDto[];
  allocations: FinancialEntryAllocationWritableDto[];
};

export type CreateFinancialEntryDto = FinancialEntryWritableDto & {
  organizationId: string;
};

export type UpdateFinancialEntryDto = FinancialEntryWritableDto & {
  organizationId: string;
  id: string;
};

export type DeleteFinancialEntryDto = {
  organizationId: string;
  id: string;
};

export type RestoreFinancialEntryDto = {
  organizationId: string;
  id: string;
};

export type FindFinancialEntryByIdDto = {
  organizationId: string;
  id: string;
};

export type ListFinancialEntriesDto = {
  organizationId: string;
  operation?: FinancialEntryOperation;
  status?: FinancialEntryStatus[];
  chartOfAccountId?: string[];
  costCenterId?: string[];
  search?: string;
  dueFrom?: Date;
  dueTo?: Date;
  competenceFrom?: Date;
  competenceTo?: Date;
  bankAccountId?: string;
  sort?: FinancialEntrySortOption;
  tab?: FinancialEntryListTab;
  page?: number;
  perPage?: number;
};

export type ListFinancialEntriesResult = {
  items: FinancialEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: FinancialEntryTabCounts;
};

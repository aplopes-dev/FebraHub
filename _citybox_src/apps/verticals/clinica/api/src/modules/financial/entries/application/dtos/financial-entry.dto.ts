import type { FinancialEntry } from '../../domain/entities/financial-entry.entity';
import type {
  FinancialEntryLoaded,
  FinancialEntryListSortBy,
  FinancialEntryStats,
} from '../../domain/repositories/financial-entry.repository.interface';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import type { RecurrenceType } from '../utils/financial-entry.utils';

export type ListFinancialEntriesDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  startDate?: string;
  endDate?: string;
  dateField?: 'dueDate' | 'paidAt';
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  statuses?: string;
  hasReceipt?: boolean;
  accountIds?: string;
  paymentMethods?: string;
  categoryIds?: string;
  patientId?: string;
  search?: string;
  sortBy?: FinancialEntryListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type ListFinancialEntriesResult = {
  items: FinancialEntryLoaded[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type StatsFinancialEntriesDto = {
  storeId: string;
  startDate?: string;
  endDate?: string;
};

export type CreateFinancialEntryDto = {
  storeId: string;
  type: 'income' | 'expense';
  description: string;
  valueCents: number;
  dueDate: string;
  categoryId?: string;
  incomeCategoryId?: string;
  patientId?: string;
  observation?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceTimes?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  accountId?: string;
  paidValueCents?: number;
  paymentDate?: string;
  receiptObjectKey?: string;
};

export type FindFinancialEntryByIdDto = {
  storeId: string;
  entryId: string;
};

export type UpdateFinancialEntryDto = {
  storeId: string;
  entryId: string;
  description?: string;
  valueCents?: number;
  dueDate?: string;
  categoryId?: string | null;
  incomeCategoryId?: string | null;
  observation?: string | null;
};

export type DeleteFinancialEntryDto = {
  storeId: string;
  entryId: string;
};

export type SettleFinancialEntryDto = {
  storeId: string;
  entryId: string;
  paymentMethod: string;
  accountId: string;
  paidValueCents: number;
  settledAt: string;
  paymentType?: string;
  observation?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};

export type CancelFinancialEntryDto = {
  storeId: string;
  entryId: string;
  actor: AuthenticatedUser;
};

export type UpdateFinancialEntryRecurrenceDto = {
  storeId: string;
  groupId: string;
  scope: 'this' | 'this_and_future' | 'all';
  entryId?: string;
  description?: string;
  valueCents?: number;
};

export type UpdateFinancialEntryRecurrenceResult = {
  count: number;
  entries: FinancialEntry[];
};

export type StatsFinancialEntriesResult = {
  data: FinancialEntryStats;
};

export type EntriesByPaymentMethodDto = {
  storeId: string;
  startDate?: string;
  endDate?: string;
  dateField?: 'dueDate' | 'paidAt';
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  accountIds?: string;
  paymentMethods?: string;
};

export type EntriesByPaymentMethodResult = {
  data: Array<{
    paymentMethod: string;
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
  }>;
};

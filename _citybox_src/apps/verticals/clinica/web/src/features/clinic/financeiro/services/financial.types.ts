import type { FinancialEntry, FinancialStats } from "../types";

export interface FinancialAccount {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  color: string;
}

export interface CreateIncomeCategoryPayload {
  name: string;
  color?: string;
}

export interface UpdateIncomeCategoryPayload {
  name?: string;
  color?: string;
}

export interface CreateFinancialAccountPayload {
  name: string;
  type?: string;
}

export interface UpdateFinancialAccountPayload {
  name?: string;
  type?: string;
  isActive?: boolean;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  color?: string;
}

export interface UpdateExpenseCategoryPayload {
  name?: string;
  color?: string;
}

export interface ListEntriesParams {
  startDate?: string;
  endDate?: string;
  /** Campo do período (default no BE: `dueDate`). Transações usa `paidAt`. */
  dateField?: "dueDate" | "paidAt";
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  statuses?: string;
  hasReceipt?: boolean;
  accountIds?: string;
  paymentMethods?: string;
  categoryIds?: string;
  patientId?: string;
  page?: number;
  /** UI alias; enviado como `perPage` (máx. 100). */
  limit?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ByPaymentMethodParams {
  startDate?: string;
  endDate?: string;
  dateField?: "dueDate" | "paidAt";
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  accountIds?: string;
  paymentMethods?: string;
}

export interface PaymentMethodAggregateRow {
  paymentMethod: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

export interface StatsParams {
  startDate?: string;
  endDate?: string;
}

export interface CreateEntryPayload {
  type: "income" | "expense";
  description: string;
  value: number;
  dueDate: string;
  categoryId?: string;
  incomeCategoryId?: string;
  patientId?: string;
  observation?: string;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceTimes?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  accountId?: string;
  paidValue?: number;
  paymentDate?: string;
  receiptKey?: string;
  receiptUrl?: string;
}

export interface UpdateEntryPayload {
  description?: string;
  value?: number;
  dueDate?: string;
  categoryId?: string | null;
  incomeCategoryId?: string | null;
  observation?: string | null;
}

export interface PayEntryPayload {
  paymentMethod: string;
  accountId: string;
  paidValue: number;
  paidAt: string;
  paymentType?: string;
  observation?: string;
  checkDate?: string;
  checkName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkCpfCnpj?: string;
}

export interface ReceiveEntryPayload {
  paymentMethod: string;
  accountId: string;
  paidValue: number;
  receivedAt: string;
  paymentType?: string;
  observation?: string;
  checkDate?: string;
  checkName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkCpfCnpj?: string;
}

export type RecurrenceScope = "this" | "this_and_future" | "all";

export interface UpdateRecurrenceGroupPayload {
  scope: RecurrenceScope;
  description?: string;
  value?: number;
}

export interface EntriesPage {
  entries: FinancialEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export type { FinancialEntry, FinancialStats };

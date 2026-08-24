import type {
  BudgetDiscountType,
  BudgetStatus,
} from '../../domain/entities/budget.entity';
import type { BudgetItemLocationType } from '../../domain/entities/budget-item.entity';
import type {
  BudgetDetail,
  BudgetListItem,
  BudgetListSortBy,
} from '../../domain/repositories/budget.repository.interface';

export type BudgetDiscountInput = {
  type: BudgetDiscountType;
  value: number;
};

export type BudgetItemUpsertInput = {
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName: string;
  valueCents: number;
  locationType: BudgetItemLocationType;
  locationLabel: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  sortOrder: number;
};

export type BudgetUpsertPayload = {
  description: string;
  date: Date;
  observations: string;
  responsibleId: string;
  responsibleName: string;
  discount: BudgetDiscountInput | null;
  installmentEnabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
  items: BudgetItemUpsertInput[];
};

export interface CreateBudgetDto {
  storeId: string;
  patientId: string;
  input: BudgetUpsertPayload;
}

export interface UpdateBudgetDto {
  storeId: string;
  patientId: string;
  budgetId: string;
  input: BudgetUpsertPayload;
}

export interface FindBudgetByIdDto {
  storeId: string;
  patientId: string;
  budgetId: string;
}

export interface ListBudgetsDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: BudgetListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export interface ListBudgetsResult {
  items: BudgetListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface DeleteBudgetDto {
  storeId: string;
  patientId: string;
  budgetId: string;
}

export interface UpdateBudgetStatusDto {
  storeId: string;
  patientId: string;
  budgetId: string;
  status: Extract<BudgetStatus, 'approved' | 'rejected' | 'expired' | 'pending'>;
  rejectedAt?: string;
  rejectionReason?: string;
  /** Vencimento dos lançamentos gerados na aprovação (`yyyy-MM-dd`). */
  dueDate?: string;
  /** Parcelas customizadas (vencimento + valor) na aprovação parcelada. */
  installments?: Array<{ dueDate: string; valueCents: number }>;
}

export type { BudgetDetail };

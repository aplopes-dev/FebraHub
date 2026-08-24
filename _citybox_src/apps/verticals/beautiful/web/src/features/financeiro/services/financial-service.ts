import { beautifulFetch } from '@/lib/beautiful-api';
import type {
  ExpenseCategory,
  FinancialAccount,
  FinancialEntry,
  FinancialStats,
  IncomeCategory,
  PaymentMethodSummary,
} from '../types';
import {
  brlToCents,
  centsToBrl,
  toFinancialEntryUi,
  toFinancialStatsUi,
  type FinancialEntryApiResponse,
  type FinancialStatsApiResponse,
} from '../lib/financial-api-mappers';

const MAX_PER_PAGE = 100;

type ApiListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type AccountApi = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

type CategoryApi = {
  id: string;
  kind: 'income' | 'expense';
  name: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
};

type PaymentMethodAggregateRow = {
  paymentMethod: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type ListEntriesParams = {
  startDate?: string;
  endDate?: string;
  dateField?: 'dueDate' | 'paidAt';
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  statuses?: string;
  accountIds?: string;
  paymentMethods?: string;
  categoryIds?: string;
  clientId?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type ByPaymentMethodParams = {
  startDate?: string;
  endDate?: string;
  dateField?: 'dueDate' | 'paidAt';
  paidAtFrom?: string;
  paidAtTo?: string;
  types?: string;
  accountIds?: string;
  paymentMethods?: string;
};

export type StatsParams = {
  startDate?: string;
  endDate?: string;
};

export type EntriesPage = {
  entries: FinancialEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateFinancialAccountPayload = {
  name: string;
  type?: string;
};

export type UpdateFinancialAccountPayload = {
  name?: string;
  type?: string;
  isActive?: boolean;
};

export type CreateCategoryPayload = {
  name: string;
  color?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  color?: string;
};

export type CreateEntryPayload = {
  type: 'income' | 'expense';
  description: string;
  value: number;
  dueDate: string;
  categoryId?: string;
  incomeCategoryId?: string;
  clientId?: string;
  appointmentId?: string;
  observation?: string;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceTimes?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  accountId?: string;
  paidValue?: number;
  paymentDate?: string;
};

export type UpdateEntryPayload = {
  description?: string;
  value?: number;
  dueDate?: string;
  categoryId?: string | null;
  incomeCategoryId?: string | null;
  observation?: string | null;
};

export type SettleEntryPayload = {
  paymentMethod: string;
  accountId: string;
  paidValue: number;
  paymentType?: string;
  observation?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};

export type ReceiveEntryPayload = SettleEntryPayload & {
  receivedAt: string;
};

export type PayEntryPayload = SettleEntryPayload & {
  paidAt: string;
};

function toAccountUi(api: AccountApi): FinancialAccount {
  const type =
    api.type === 'cash' || api.type === 'checking' || api.type === 'savings'
      ? api.type
      : 'checking';
  return {
    id: api.id,
    name: api.name,
    type,
    isActive: api.isActive,
    createdAt: api.createdAt.slice(0, 10),
  };
}

function toCategoryUi(api: CategoryApi): ExpenseCategory | IncomeCategory {
  return {
    id: api.id,
    name: api.name,
    color: api.color,
  };
}

function buildEntriesQuery(params: ListEntriesParams): string {
  const page = params.page ?? 1;
  const perPage = Math.min(params.perPage ?? MAX_PER_PAGE, MAX_PER_PAGE);
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('perPage', String(perPage));
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.dateField) qs.set('dateField', params.dateField);
  if (params.paidAtFrom) qs.set('paidAtFrom', params.paidAtFrom);
  if (params.paidAtTo) qs.set('paidAtTo', params.paidAtTo);
  if (params.types) qs.set('types', params.types);
  if (params.statuses) qs.set('statuses', params.statuses);
  if (params.accountIds) qs.set('accountIds', params.accountIds);
  if (params.paymentMethods) qs.set('paymentMethods', params.paymentMethods);
  if (params.categoryIds) qs.set('categoryIds', params.categoryIds);
  if (params.clientId) qs.set('clientId', params.clientId);
  if (params.search) qs.set('search', params.search);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
  return `/v1/financial/entries?${qs.toString()}`;
}

function buildByPaymentMethodQuery(params: ByPaymentMethodParams): string {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.dateField) qs.set('dateField', params.dateField);
  if (params.paidAtFrom) qs.set('paidAtFrom', params.paidAtFrom);
  if (params.paidAtTo) qs.set('paidAtTo', params.paidAtTo);
  if (params.types) qs.set('types', params.types);
  if (params.accountIds) qs.set('accountIds', params.accountIds);
  if (params.paymentMethods) qs.set('paymentMethods', params.paymentMethods);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return `/v1/financial/entries/by-payment-method${suffix}`;
}

function settleBody(payload: SettleEntryPayload) {
  return {
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId,
    paidValueCents: brlToCents(payload.paidValue),
    ...(payload.paymentType ? { paymentType: payload.paymentType } : {}),
    ...(payload.observation !== undefined
      ? { observation: payload.observation }
      : {}),
    ...(payload.checkIssueDate
      ? { checkIssueDate: payload.checkIssueDate }
      : {}),
    ...(payload.checkHolderName
      ? { checkHolderName: payload.checkHolderName }
      : {}),
    ...(payload.checkNumber ? { checkNumber: payload.checkNumber } : {}),
    ...(payload.checkBank ? { checkBank: payload.checkBank } : {}),
    ...(payload.checkDocument ? { checkDocument: payload.checkDocument } : {}),
  };
}

export function toPaymentMethodSummary(
  row: PaymentMethodAggregateRow,
): PaymentMethodSummary {
  return {
    method: row.paymentMethod,
    income: centsToBrl(row.incomeCents),
    expense: centsToBrl(row.expenseCents),
    balance: centsToBrl(row.balanceCents),
  };
}

export function statsFromPaymentMethodSummaries(
  rows: PaymentMethodSummary[],
): FinancialStats {
  let incomeReceived = 0;
  let expensePaid = 0;
  for (const row of rows) {
    incomeReceived += row.income;
    expensePaid += row.expense;
  }
  return {
    income: {
      received: incomeReceived,
      toReceive: 0,
      total: incomeReceived,
    },
    expense: {
      paid: expensePaid,
      toPay: 0,
      total: expensePaid,
    },
    balance: {
      current: incomeReceived - expensePaid,
      projected: incomeReceived - expensePaid,
    },
  };
}

export const financialService = {
  accounts: {
    list: async (params?: {
      includeInactive?: boolean;
    }): Promise<FinancialAccount[]> => {
      const qs = new URLSearchParams();
      if (params?.includeInactive) qs.set('includeInactive', 'true');
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const res = await beautifulFetch<{ data: AccountApi[] }>(
        `/v1/financial/accounts${suffix}`,
      );
      return res.data.map(toAccountUi);
    },

    create: async (
      data: CreateFinancialAccountPayload,
    ): Promise<FinancialAccount> => {
      const res = await beautifulFetch<{ data: AccountApi }>(
        '/v1/financial/accounts',
        {
          method: 'POST',
          body: JSON.stringify({
            name: data.name,
            ...(data.type ? { type: data.type } : {}),
          }),
        },
      );
      return toAccountUi(res.data);
    },

    update: async (
      id: string,
      data: UpdateFinancialAccountPayload,
    ): Promise<void> => {
      await beautifulFetch(`/v1/financial/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await beautifulFetch(`/v1/financial/accounts/${id}`, {
        method: 'DELETE',
      });
    },
  },

  categories: {
    list: async (
      kind: 'income' | 'expense',
    ): Promise<(ExpenseCategory | IncomeCategory)[]> => {
      const res = await beautifulFetch<{ data: CategoryApi[] }>(
        `/v1/financial/categories?kind=${kind}`,
      );
      return res.data.map(toCategoryUi);
    },

    create: async (
      kind: 'income' | 'expense',
      data: CreateCategoryPayload,
    ): Promise<ExpenseCategory | IncomeCategory> => {
      const res = await beautifulFetch<{ data: CategoryApi }>(
        '/v1/financial/categories',
        {
          method: 'POST',
          body: JSON.stringify({
            kind,
            name: data.name,
            ...(data.color ? { color: data.color } : {}),
          }),
        },
      );
      return toCategoryUi(res.data);
    },

    update: async (
      id: string,
      data: UpdateCategoryPayload,
    ): Promise<void> => {
      await beautifulFetch(`/v1/financial/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await beautifulFetch(`/v1/financial/categories/${id}`, {
        method: 'DELETE',
      });
    },
  },

  entries: {
    list: async (params: ListEntriesParams): Promise<EntriesPage> => {
      const res = await beautifulFetch<{
        data: FinancialEntryApiResponse[];
        meta: ApiListMeta;
      }>(buildEntriesQuery(params));

      return {
        entries: res.data.map(toFinancialEntryUi),
        pagination: {
          page: res.meta.page,
          limit: res.meta.perPage,
          total: res.meta.total,
          totalPages: res.meta.totalPages,
        },
      };
    },

    listByPaymentMethod: async (
      params: ByPaymentMethodParams,
    ): Promise<PaymentMethodSummary[]> => {
      const res = await beautifulFetch<{ data: PaymentMethodAggregateRow[] }>(
        buildByPaymentMethodQuery(params),
      );
      return res.data.map(toPaymentMethodSummary);
    },

    stats: async (params: StatsParams): Promise<FinancialStats> => {
      const qs = new URLSearchParams();
      if (params.startDate) qs.set('startDate', params.startDate);
      if (params.endDate) qs.set('endDate', params.endDate);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const res = await beautifulFetch<{ data: FinancialStatsApiResponse }>(
        `/v1/financial/entries/stats${suffix}`,
      );
      return toFinancialStatsUi(res.data);
    },

    getById: async (id: string): Promise<FinancialEntry> => {
      const res = await beautifulFetch<{ data: FinancialEntryApiResponse }>(
        `/v1/financial/entries/${id}`,
      );
      return toFinancialEntryUi(res.data);
    },

    create: async (data: CreateEntryPayload): Promise<{ ids: string[] }> => {
      const res = await beautifulFetch<{ data: FinancialEntryApiResponse[] }>(
        '/v1/financial/entries',
        {
          method: 'POST',
          body: JSON.stringify({
            type: data.type,
            description: data.description,
            valueCents: brlToCents(data.value),
            dueDate: data.dueDate,
            ...(data.categoryId ? { categoryId: data.categoryId } : {}),
            ...(data.incomeCategoryId
              ? { incomeCategoryId: data.incomeCategoryId }
              : {}),
            ...(data.clientId ? { clientId: data.clientId } : {}),
            ...(data.appointmentId
              ? { appointmentId: data.appointmentId }
              : {}),
            ...(data.observation !== undefined
              ? { observation: data.observation }
              : {}),
            ...(data.isRecurring !== undefined
              ? { isRecurring: data.isRecurring }
              : {}),
            ...(data.recurrenceType
              ? { recurrenceType: data.recurrenceType }
              : {}),
            ...(data.recurrenceTimes !== undefined
              ? { recurrenceTimes: data.recurrenceTimes }
              : {}),
            ...(data.isPaid !== undefined ? { isPaid: data.isPaid } : {}),
            ...(data.paymentMethod
              ? { paymentMethod: data.paymentMethod }
              : {}),
            ...(data.accountId ? { accountId: data.accountId } : {}),
            ...(data.paidValue !== undefined
              ? { paidValueCents: brlToCents(data.paidValue) }
              : {}),
            ...(data.paymentDate ? { paymentDate: data.paymentDate } : {}),
          }),
        },
      );
      return { ids: res.data.map((entry) => entry.id) };
    },

    update: async (id: string, data: UpdateEntryPayload): Promise<void> => {
      await beautifulFetch(`/v1/financial/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.value !== undefined
            ? { valueCents: brlToCents(data.value) }
            : {}),
          ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
          ...(data.categoryId !== undefined
            ? { categoryId: data.categoryId }
            : {}),
          ...(data.incomeCategoryId !== undefined
            ? { incomeCategoryId: data.incomeCategoryId }
            : {}),
          ...(data.observation !== undefined
            ? { observation: data.observation }
            : {}),
        }),
      });
    },

    delete: async (id: string): Promise<void> => {
      await beautifulFetch(`/v1/financial/entries/${id}`, {
        method: 'DELETE',
      });
    },

    receive: async (
      id: string,
      data: ReceiveEntryPayload,
    ): Promise<void> => {
      await beautifulFetch(`/v1/financial/entries/${id}/receive`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...settleBody(data),
          receivedAt: data.receivedAt,
        }),
      });
    },

    pay: async (id: string, data: PayEntryPayload): Promise<void> => {
      await beautifulFetch(`/v1/financial/entries/${id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...settleBody(data),
          paidAt: data.paidAt,
        }),
      });
    },

    cancel: async (id: string): Promise<void> => {
      await beautifulFetch(`/v1/financial/entries/${id}/cancel`, {
        method: 'PATCH',
      });
    },
  },
};

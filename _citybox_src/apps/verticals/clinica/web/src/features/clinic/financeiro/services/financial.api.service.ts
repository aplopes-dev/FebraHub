import { clinicaFetch } from "@/features/clinic/shared/api";
import type { FinancialStats } from "../types";
import {
  toCreateEntryBody,
  toFinancialEntryUi,
  toFinancialStatsUi,
  toPayEntryBody,
  toReceiveEntryBody,
  toRecurrenceBody,
  toUpdateEntryBody,
  type FinancialEntryApiResponse,
  type FinancialStatsApiResponse,
} from "../lib/financial-api-mappers";
import type {
  CreateEntryPayload,
  CreateExpenseCategoryPayload,
  CreateFinancialAccountPayload,
  CreateIncomeCategoryPayload,
  EntriesPage,
  ExpenseCategory,
  FinancialAccount,
  IncomeCategory,
  ListEntriesParams,
  PayEntryPayload,
  ReceiveEntryPayload,
  StatsParams,
  UpdateEntryPayload,
  UpdateExpenseCategoryPayload,
  UpdateFinancialAccountPayload,
  UpdateIncomeCategoryPayload,
  UpdateRecurrenceGroupPayload,
  ByPaymentMethodParams,
  PaymentMethodAggregateRow,
} from "./financial.types";

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
  kind: "income" | "expense";
  name: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
};

function buildEntriesQuery(params: ListEntriesParams): string {
  const page = params.page ?? 1;
  const perPage = Math.min(
    params.perPage ?? params.limit ?? MAX_PER_PAGE,
    MAX_PER_PAGE,
  );
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("perPage", String(perPage));
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  if (params.dateField) qs.set("dateField", params.dateField);
  if (params.paidAtFrom) qs.set("paidAtFrom", params.paidAtFrom);
  if (params.paidAtTo) qs.set("paidAtTo", params.paidAtTo);
  if (params.types) qs.set("types", params.types);
  if (params.statuses) qs.set("statuses", params.statuses);
  if (params.hasReceipt !== undefined) {
    qs.set("hasReceipt", String(params.hasReceipt));
  }
  if (params.accountIds) qs.set("accountIds", params.accountIds);
  if (params.paymentMethods) qs.set("paymentMethods", params.paymentMethods);
  if (params.categoryIds) qs.set("categoryIds", params.categoryIds);
  if (params.patientId) qs.set("patientId", params.patientId);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
  return `/v1/financial/entries?${qs.toString()}`;
}

function buildByPaymentMethodQuery(params: ByPaymentMethodParams): string {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  if (params.dateField) qs.set("dateField", params.dateField);
  if (params.paidAtFrom) qs.set("paidAtFrom", params.paidAtFrom);
  if (params.paidAtTo) qs.set("paidAtTo", params.paidAtTo);
  if (params.types) qs.set("types", params.types);
  if (params.accountIds) qs.set("accountIds", params.accountIds);
  if (params.paymentMethods) qs.set("paymentMethods", params.paymentMethods);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return `/v1/financial/entries/by-payment-method${suffix}`;
}

function toAccountUi(api: AccountApi): FinancialAccount {
  return {
    id: api.id,
    name: api.name,
    type: api.type,
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

export const financialService = {
  accounts: {
    list: async (
      storeId: string,
      params?: { includeInactive?: boolean },
    ): Promise<{ accounts: FinancialAccount[] }> => {
      const qs = new URLSearchParams();
      if (params?.includeInactive) qs.set("includeInactive", "true");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await clinicaFetch<{ data: AccountApi[] }>(
        storeId,
        `/v1/financial/accounts${suffix}`,
      );
      return { accounts: res.data.map(toAccountUi) };
    },

    create: async (
      storeId: string,
      data: CreateFinancialAccountPayload,
    ): Promise<{ id: string; name: string }> => {
      const res = await clinicaFetch<{ data: AccountApi }>(
        storeId,
        "/v1/financial/accounts",
        {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            ...(data.type ? { type: data.type } : {}),
          }),
        },
      );
      return { id: res.data.id, name: res.data.name };
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateFinancialAccountPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/accounts/${id}`, {
        method: "DELETE",
      });
    },
  },

  categories: {
    list: async (
      storeId: string,
    ): Promise<{ categories: ExpenseCategory[] }> => {
      const res = await clinicaFetch<{ data: CategoryApi[] }>(
        storeId,
        "/v1/financial/categories?kind=expense",
      );
      return { categories: res.data.map(toCategoryUi) };
    },

    create: async (
      storeId: string,
      data: CreateExpenseCategoryPayload,
    ): Promise<{ id: string; name: string; color: string }> => {
      const res = await clinicaFetch<{ data: CategoryApi }>(
        storeId,
        "/v1/financial/categories",
        {
          method: "POST",
          body: JSON.stringify({
            kind: "expense",
            name: data.name,
            ...(data.color ? { color: data.color } : {}),
          }),
        },
      );
      return {
        id: res.data.id,
        name: res.data.name,
        color: res.data.color,
      };
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateExpenseCategoryPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/categories/${id}`, {
        method: "DELETE",
      });
    },
  },

  incomeCategories: {
    list: async (
      storeId: string,
    ): Promise<{ categories: IncomeCategory[] }> => {
      const res = await clinicaFetch<{ data: CategoryApi[] }>(
        storeId,
        "/v1/financial/categories?kind=income",
      );
      return { categories: res.data.map(toCategoryUi) };
    },

    create: async (
      storeId: string,
      data: CreateIncomeCategoryPayload,
    ): Promise<{ id: string; name: string; color: string }> => {
      const res = await clinicaFetch<{ data: CategoryApi }>(
        storeId,
        "/v1/financial/categories",
        {
          method: "POST",
          body: JSON.stringify({
            kind: "income",
            name: data.name,
            ...(data.color ? { color: data.color } : {}),
          }),
        },
      );
      return {
        id: res.data.id,
        name: res.data.name,
        color: res.data.color,
      };
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateIncomeCategoryPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/categories/${id}`, {
        method: "DELETE",
      });
    },
  },

  entries: {
    list: async (
      storeId: string,
      params: ListEntriesParams,
    ): Promise<EntriesPage> => {
      const res = await clinicaFetch<{
        data: FinancialEntryApiResponse[];
        meta: ApiListMeta;
      }>(storeId, buildEntriesQuery(params));

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
      storeId: string,
      params: ByPaymentMethodParams,
    ): Promise<PaymentMethodAggregateRow[]> => {
      const res = await clinicaFetch<{ data: PaymentMethodAggregateRow[] }>(
        storeId,
        buildByPaymentMethodQuery(params),
      );
      return res.data;
    },

    stats: async (
      storeId: string,
      params: StatsParams,
    ): Promise<FinancialStats> => {
      const qs = new URLSearchParams();
      if (params.startDate) qs.set("startDate", params.startDate);
      if (params.endDate) qs.set("endDate", params.endDate);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await clinicaFetch<{ data: FinancialStatsApiResponse }>(
        storeId,
        `/v1/financial/entries/stats${suffix}`,
      );
      return toFinancialStatsUi(res.data);
    },

    create: async (
      storeId: string,
      data: CreateEntryPayload,
    ): Promise<{ ids: string[] }> => {
      const res = await clinicaFetch<{ data: FinancialEntryApiResponse[] }>(
        storeId,
        "/v1/financial/entries",
        {
          method: "POST",
          body: JSON.stringify(toCreateEntryBody(data)),
        },
      );
      return { ids: res.data.map((entry) => entry.id) };
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateEntryPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(toUpdateEntryBody(data)),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/entries/${id}`, {
        method: "DELETE",
      });
    },

    pay: async (
      storeId: string,
      id: string,
      data: PayEntryPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/entries/${id}/pay`, {
        method: "PATCH",
        body: JSON.stringify(toPayEntryBody(data)),
      });
    },

    receive: async (
      storeId: string,
      id: string,
      data: ReceiveEntryPayload,
    ): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/entries/${id}/receive`, {
        method: "PATCH",
        body: JSON.stringify(toReceiveEntryBody(data)),
      });
    },

    cancel: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch(storeId, `/v1/financial/entries/${id}/cancel`, {
        method: "PATCH",
      });
    },

    updateRecurrenceGroup: async (
      storeId: string,
      params: { entryId: string; groupId: string },
      data: UpdateRecurrenceGroupPayload,
    ): Promise<{ count: number }> => {
      const res = await clinicaFetch<{
        data: { count: number; entries: FinancialEntryApiResponse[] };
      }>(storeId, `/v1/financial/entries/recurrence/${params.groupId}`, {
        method: "PATCH",
        body: JSON.stringify(toRecurrenceBody(params.entryId, data)),
      });
      return { count: res.data.count };
    },
  },
};

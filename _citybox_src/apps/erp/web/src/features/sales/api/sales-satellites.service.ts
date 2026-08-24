"use client";

import { comercioFetch } from "@/lib/api/comercio-client";

/** Thin API client for service orders — payload shape matches API. */
export async function listServiceOrdersApi(params: {
  search?: string;
  statusId?: string;
  page?: number;
  perPage?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.statusId) query.set("statusId", params.statusId);
  query.set("page", String(params.page ?? 1));
  query.set("perPage", String(params.perPage ?? 20));
  return comercioFetch<{ data: unknown[]; meta: unknown }>(
    `/v1/service-orders?${query}`,
  );
}

export async function createServiceOrderApi(body: unknown) {
  return comercioFetch("/v1/service-orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateServiceOrderApi(id: string, body: unknown) {
  return comercioFetch(`/v1/service-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function generateSaleFromServiceOrderApi(id: string) {
  return comercioFetch(`/v1/service-orders/${id}/generate-sale`, {
    method: "POST",
  });
}

export async function listServiceOrderStatusesApi() {
  return comercioFetch<{ data: unknown[] }>("/v1/service-order-statuses");
}

export async function listSalesContractsApi(params: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("page", String(params.page ?? 1));
  query.set("perPage", String(params.perPage ?? 20));
  return comercioFetch<{ data: unknown[]; meta: unknown }>(
    `/v1/sales-contracts?${query}`,
  );
}

export async function createSalesContractApi(body: unknown) {
  return comercioFetch("/v1/sales-contracts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSalesContractApi(id: string, body: unknown) {
  return comercioFetch(`/v1/sales-contracts/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function listContractStatusesApi() {
  return comercioFetch<{ data: unknown[] }>("/v1/contract-statuses");
}

export async function listBankAccountsApi() {
  return comercioFetch<{ data: unknown[] }>("/v1/bank-accounts");
}

export async function createBankAccountApi(body: unknown) {
  return comercioFetch("/v1/bank-accounts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listFinancialEntriesApi(params: {
  search?: string;
  operation?: string;
  page?: number;
  perPage?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.operation) query.set("operation", params.operation);
  query.set("page", String(params.page ?? 1));
  query.set("perPage", String(params.perPage ?? 20));
  return comercioFetch<{ data: unknown[]; meta: unknown }>(
    `/v1/financial-entries?${query}`,
  );
}

export async function createFinancialEntryApi(body: unknown) {
  return comercioFetch("/v1/financial-entries", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

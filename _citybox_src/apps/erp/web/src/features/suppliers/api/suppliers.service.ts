"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  SaveSupplierPayload,
  SupplierListResponseDto,
  SupplierResponseDto,
} from "@/features/suppliers/api/supplier.dto";
import { toSupplier } from "@/features/suppliers/api/supplier.mapper";
import type {
  Supplier,
  SupplierListParams,
  SupplierListResult,
} from "@/features/suppliers/types/supplier";

/** Teto de `perPage` da API (`MAX_PER_PAGE`). */
const MAX_PER_PAGE = 100;

function buildListQuery(params: SupplierListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listSuppliers(
  params: SupplierListParams,
): Promise<SupplierListResult> {
  const response = await comercioFetch<SupplierListResponseDto>(
    `/v1/suppliers?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toSupplier),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

/**
 * Fornecedores ativos para selects de outras telas (ex.: o combobox
 * Cliente+Fornecedor dos lançamentos financeiros, o painel Fornecedor da
 * compra).
 *
 * Percorre TODAS as páginas — ver `listCarrierOptions` para o porquê.
 */
export async function listActiveSuppliers(): Promise<Supplier[]> {
  const suppliers: Supplier[] = [];
  let page = 1;

  while (true) {
    const response = await comercioFetch<SupplierListResponseDto>(
      `/v1/suppliers?tab=active&page=${page}&perPage=${MAX_PER_PAGE}`,
    );
    suppliers.push(...response.data.map(toSupplier));
    if (page >= response.meta.totalPages || response.data.length === 0) break;
    page += 1;
  }

  return suppliers;
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const response = await comercioFetch<SupplierResponseDto>(
    `/v1/suppliers/${id}`,
  );
  return toSupplier(response.data);
}

export async function createSupplier(
  payload: SaveSupplierPayload,
): Promise<Supplier> {
  const response = await comercioFetch<SupplierResponseDto>("/v1/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toSupplier(response.data);
}

export async function updateSupplier(
  id: string,
  payload: SaveSupplierPayload,
): Promise<Supplier> {
  const response = await comercioFetch<SupplierResponseDto>(
    `/v1/suppliers/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toSupplier(response.data);
}

export async function deleteSupplier(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/suppliers/${id}`, { method: "DELETE" });
}

export async function restoreSupplier(id: string): Promise<Supplier> {
  const response = await comercioFetch<SupplierResponseDto>(
    `/v1/suppliers/${id}/restore`,
    { method: "POST" },
  );
  return toSupplier(response.data);
}

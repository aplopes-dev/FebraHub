"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PurchaseDetailResponseDto,
  PurchaseListResponseDto,
  PurchaseSingleResponseDto,
  SavePurchasePayload,
} from "@/features/purchases/api/purchase.dto";
import {
  toPurchaseDetail,
  toPurchaseListItem,
} from "@/features/purchases/api/purchase.mapper";
import type {
  PurchaseDetail,
  PurchaseListParams,
  PurchaseListResult,
} from "@/features/purchases/types/purchase";

function buildListQuery(params: PurchaseListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.status !== "all") query.set("status", params.status);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.warehouseId) {
    query.set("stockId", params.filters.warehouseId);
  }
  if (params.filters.supplierId) {
    query.set("supplierId", params.filters.supplierId);
  }
  if (params.filters.dateFrom) query.set("dateFrom", params.filters.dateFrom);
  if (params.filters.dateTo) query.set("dateTo", params.filters.dateTo);
  return query.toString();
}

export async function listPurchasesApi(
  params: PurchaseListParams,
): Promise<PurchaseListResult> {
  const response = await comercioFetch<PurchaseListResponseDto>(
    `/v1/purchases?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toPurchaseListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function getPurchaseByIdApi(id: string): Promise<PurchaseDetail> {
  const response = await comercioFetch<PurchaseDetailResponseDto>(
    `/v1/purchases/${id}`,
  );
  return toPurchaseDetail(response.data);
}

export async function createPurchaseApi(
  payload: SavePurchasePayload,
): Promise<void> {
  await comercioFetch<PurchaseSingleResponseDto>("/v1/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePurchaseApi(
  id: string,
  payload: SavePurchasePayload,
): Promise<void> {
  await comercioFetch<PurchaseSingleResponseDto>(`/v1/purchases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePurchaseApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/purchases/${id}`, { method: "DELETE" });
}

export async function restorePurchaseApi(id: string): Promise<void> {
  await comercioFetch<PurchaseSingleResponseDto>(`/v1/purchases/${id}/restore`, {
    method: "POST",
  });
}

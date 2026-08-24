"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  AddProductionHistoryCommentPayload,
  CreateProductionOrderPayload,
  FinalizeProductionOrderPayload,
  ProductionHistoryEntryDto,
  ProductionHistoryListResponseDto,
  ProductionOrderDetailResponseDto,
  ProductionOrderListResponseDto,
  ProductionOrderSingleResponseDto,
} from "@/features/production/api/production.dto";
import {
  toProductionHistoryEntry,
  toProductionOrder,
  toProductionOrderDetail,
} from "@/features/production/api/production.mapper";
import type {
  ProductionHistoryEntry,
  ProductionOrderDetail,
  ProductionOrderFormValues,
  ProductionOrderListParams,
  ProductionOrderListResult,
} from "@/features/production/types/production";

function buildListQuery(params: ProductionOrderListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listProductionOrdersApi(
  params: ProductionOrderListParams,
): Promise<ProductionOrderListResult> {
  const response = await comercioFetch<ProductionOrderListResponseDto>(
    `/v1/production-orders?${buildListQuery(params)}`,
  );
  return {
    data: response.data.map(toProductionOrder),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function getProductionOrderApi(
  id: string,
): Promise<ProductionOrderDetail> {
  const response = await comercioFetch<ProductionOrderDetailResponseDto>(
    `/v1/production-orders/${id}`,
  );
  return toProductionOrderDetail(response.data);
}

export async function createProductionOrderApi(
  values: ProductionOrderFormValues,
): Promise<void> {
  const payload: CreateProductionOrderPayload = {
    productId: values.productId,
    plannedQuantity: String(values.plannedQuantity),
    sourceStockId: values.sourceStockId,
    destinationStockId: values.destinationStockId,
    expectedDate: values.expectedDate,
  };
  await comercioFetch<ProductionOrderSingleResponseDto>(
    "/v1/production-orders",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function startProductionOrderApi(id: string): Promise<void> {
  await comercioFetch<ProductionOrderSingleResponseDto>(
    `/v1/production-orders/${id}/start`,
    { method: "POST" },
  );
}

export async function cancelProductionOrderApi(id: string): Promise<void> {
  await comercioFetch<ProductionOrderSingleResponseDto>(
    `/v1/production-orders/${id}/cancel`,
    { method: "POST" },
  );
}

export async function finalizeProductionOrderApi(
  id: string,
  payload: FinalizeProductionOrderPayload,
): Promise<void> {
  await comercioFetch<ProductionOrderSingleResponseDto>(
    `/v1/production-orders/${id}/finalize`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function listProductionHistoryApi(
  orderId: string,
): Promise<ProductionHistoryEntry[]> {
  const response = await comercioFetch<ProductionHistoryListResponseDto>(
    `/v1/production-orders/${orderId}/history`,
  );
  // API devolve mais antigo primeiro; a timeline mostra o mais recente no topo.
  return response.data
    .map(toProductionHistoryEntry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addProductionHistoryCommentApi(
  orderId: string,
  payload: AddProductionHistoryCommentPayload,
): Promise<ProductionHistoryEntry> {
  const entry = await comercioFetch<ProductionHistoryEntryDto>(
    `/v1/production-orders/${orderId}/history`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toProductionHistoryEntry(entry);
}

"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  PatchSaleOrderStatusPayload,
  SaleOrderDetailResponseDto,
  SaleOrderListResponseDto,
  SaleOrderSingleResponseDto,
  SaveSaleOrderPayload,
} from "@/features/sales-orders/api/sale-order.dto";
import {
  toSaleOrderDetail,
  toSaleOrderListItem,
} from "@/features/sales-orders/api/sale-order.mapper";
import type {
  SaleOrder,
  SaleOrderListParams,
  SaleOrderListResult,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";
import { resolveSaleOrderPeriodRange } from "@/features/sales-orders/lib/sale-order-period";

function buildListQuery(params: SaleOrderListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  query.set("sort", params.sort);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.statuses.length > 0) {
    for (const status of params.filters.statuses) {
      query.append("statuses", status);
    }
  }
  if (params.filters.channelId) {
    query.set("channelId", params.filters.channelId);
  }
  if (params.filters.amountMin != null) {
    query.set("amountMinCents", String(Math.round(params.filters.amountMin * 100)));
  }
  if (params.filters.amountMax != null) {
    query.set("amountMaxCents", String(Math.round(params.filters.amountMax * 100)));
  }
  // Presets de UI → intervalo inclusivo (ISO) que a API já filtra via dateFrom/dateTo.
  // Não enviar `periodPreset`: o DTO rejeita props fora da whitelist.
  const periodRange = resolveSaleOrderPeriodRange(params.filters.period);
  if (periodRange) {
    query.set("dateFrom", periodRange.from.toISOString());
    query.set("dateTo", periodRange.to.toISOString());
  }
  return query.toString();
}

export async function listSaleOrdersApi(
  params: SaleOrderListParams,
): Promise<SaleOrderListResult> {
  const response = await apiFetch<SaleOrderListResponseDto>(
    `/v1/sale-orders?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toSaleOrderListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function getSaleOrderByIdApi(id: string): Promise<SaleOrder> {
  const response = await apiFetch<SaleOrderDetailResponseDto>(
    `/v1/sale-orders/${id}`,
  );
  return toSaleOrderDetail(response.data);
}

export async function createSaleOrderApi(
  payload: SaveSaleOrderPayload,
): Promise<SaleOrder> {
  const response = await apiFetch<SaleOrderSingleResponseDto>(
    "/v1/sale-orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return toSaleOrderDetail(response.data);
}

export async function updateSaleOrderApi(
  id: string,
  payload: SaveSaleOrderPayload,
): Promise<SaleOrder> {
  const response = await apiFetch<SaleOrderSingleResponseDto>(
    `/v1/sale-orders/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return toSaleOrderDetail(response.data);
}

export async function patchSaleOrderStatusApi(
  id: string,
  status: SaleOrderStatus,
): Promise<SaleOrder> {
  const body: PatchSaleOrderStatusPayload = { status };
  const response = await apiFetch<SaleOrderSingleResponseDto>(
    `/v1/sale-orders/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return toSaleOrderDetail(response.data);
}

export async function deleteSaleOrderApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/sale-orders/${id}`, { method: "DELETE" });
}

export async function restoreSaleOrderApi(id: string): Promise<SaleOrder> {
  const response = await apiFetch<SaleOrderSingleResponseDto>(
    `/v1/sale-orders/${id}/restore`,
    { method: "POST" },
  );
  return toSaleOrderDetail(response.data);
}

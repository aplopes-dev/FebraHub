"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CreateStockTransferPayload,
  StockTransferCancelledResponseDto,
  StockTransferCreatedResponseDto,
  StockTransferListResponseDto,
} from "@/features/stock-transfers/api/stock-transfer.dto";
import { toStockTransferListItem } from "@/features/stock-transfers/api/stock-transfer.mapper";
import type {
  StockTransferFormValues,
  StockTransferListParams,
  StockTransferListResult,
} from "@/features/stock-transfers/types/stock-transfer";

function buildListQuery(params: StockTransferListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.fromWarehouseId) {
    query.set("fromStockId", params.filters.fromWarehouseId);
  }
  if (params.filters.toWarehouseId) {
    query.set("toStockId", params.filters.toWarehouseId);
  }
  return query.toString();
}

export async function listStockTransfersApi(
  params: StockTransferListParams,
): Promise<StockTransferListResult> {
  const response = await apiFetch<StockTransferListResponseDto>(
    `/v1/stock-transfers?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toStockTransferListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function createStockTransferApi(
  values: StockTransferFormValues,
): Promise<void> {
  const operatedAtIso = /^\d{4}-\d{2}-\d{2}$/.test(values.operatedAt)
    ? `${values.operatedAt}T12:00:00.000Z`
    : values.operatedAt;

  const payload: CreateStockTransferPayload = {
    fromStockId: values.fromWarehouseId,
    toStockId: values.toWarehouseId,
    operatedAt: operatedAtIso,
    responsibleName: values.responsibleName.trim(),
    notes: values.notes.trim() || undefined,
    lines: values.lines.map((line) => ({
      productId: line.productId,
      quantity: String(line.quantity),
      ...(line.batch?.trim() ? { batch: line.batch.trim() } : {}),
    })),
  };

  if (values.carrierId.trim()) {
    payload.carrierId = values.carrierId.trim();
  }

  await apiFetch<StockTransferCreatedResponseDto>(
    `/v1/stock-transfers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function cancelStockTransferApi(id: string): Promise<void> {
  await apiFetch<StockTransferCancelledResponseDto>(
    `/v1/stock-transfers/${id}/cancel`,
    { method: "POST" },
  );
}

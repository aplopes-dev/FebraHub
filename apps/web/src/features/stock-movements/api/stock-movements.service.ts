"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CreateStockMovementPayload,
  MovementCategoryOptionDto,
  ProductStockMovementsResponseDto,
  StockBalanceListResponseDto,
  StockMovementCreatedResponseDto,
  StockMovementDetailResponseDto,
  StockMovementListResponseDto,
} from "@/features/stock-movements/api/stock-movement.dto";
import {
  reaisToCents,
  toProductMovementLine,
  toStockBalanceItem,
  toStockMovementDetailLines,
  toStockMovementListItem,
} from "@/features/stock-movements/api/stock-movement.mapper";
import type {
  StockMovementFormValues,
  StockMovementListParams,
  StockMovementListResult,
} from "@/features/stock-movements/types/stock-movement";
import type {
  ProductMovementLine,
  StockMovementLineDetail,
} from "@/features/stock-movements/types/stock-movement-detail";
import type {
  StockBalanceItem,
  StockBalanceStatus,
} from "@/features/stock/types/stock-balance";

function buildListQuery(params: StockMovementListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.tab !== "all") query.set("tab", params.tab);
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.reason) query.set("reason", params.reason);
  return query.toString();
}

export async function listStockMovementsApi(
  params: StockMovementListParams,
): Promise<StockMovementListResult> {
  const response = await apiFetch<StockMovementListResponseDto>(
    `/v1/stock-movements?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toStockMovementListItem),
    meta: response.meta,
    tabCounts: response.tabCounts,
  };
}

export async function getStockMovementByIdApi(id: string): Promise<{
  item: ReturnType<typeof toStockMovementListItem>;
  lines: StockMovementLineDetail[];
}> {
  const response = await apiFetch<StockMovementDetailResponseDto>(
    `/v1/stock-movements/${id}`,
  );
  return {
    item: toStockMovementListItem(response.data),
    lines: toStockMovementDetailLines(response.data),
  };
}

export async function createStockMovementApi(
  values: StockMovementFormValues,
): Promise<void> {
  const payload: CreateStockMovementPayload = {
    stockId: values.warehouseId,
    categoryId: values.categoryId,
    type: values.type,
    operatedAt: values.operatedAt,
    lines: values.lines.map((line) => ({
      productId: line.productId,
      quantity: String(line.quantity),
      costCents: reaisToCents(line.costPrice),
    })),
  };

  await apiFetch<StockMovementCreatedResponseDto>("/v1/stock-movements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type StockBalanceListParams = {
  stockId: string;
  search: string;
  status?: StockBalanceStatus;
  page: number;
  perPage: number;
};

export type StockBalanceListResult = {
  data: StockBalanceItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export async function listStockBalanceApi(
  params: StockBalanceListParams,
): Promise<StockBalanceListResult> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.status) query.set("status", params.status);

  const response = await apiFetch<StockBalanceListResponseDto>(
    `/v1/stocks/${params.stockId}/balance?${query.toString()}`,
  );

  return {
    data: response.data.map((item) => ({
      ...toStockBalanceItem(item),
      stockId: params.stockId,
    })),
    meta: response.meta,
  };
}

/** Máximo aceito pelo backend (`MAX_PER_PAGE`) — não é "traz tudo". */
const BALANCE_PAGE_SIZE = 100;

/**
 * Percorre TODAS as páginas do balanço de um depósito.
 *
 * Use quando o consumidor precisa do saldo como fonte de verdade, e não como
 * uma listagem paginada na tela — caso do inventário, onde um produto ausente
 * do mapa vira "saldo 0" e o servidor entende isso como instrução de zerar o
 * estoque. Uma única página de 100 não serve para essa decisão.
 */
export async function listAllStockBalanceApi(
  stockId: string,
): Promise<StockBalanceItem[]> {
  const all: StockBalanceItem[] = [];
  let page = 1;

  while (true) {
    const result = await listStockBalanceApi({
      stockId,
      search: "",
      page,
      perPage: BALANCE_PAGE_SIZE,
    });
    all.push(...result.data);
    if (page >= result.meta.totalPages || result.data.length === 0) break;
    page += 1;
  }

  return all;
}

export async function listProductStockMovementsApi(
  stockId: string,
  productId: string,
): Promise<ProductMovementLine[]> {
  const response = await apiFetch<ProductStockMovementsResponseDto>(
    `/v1/stocks/${stockId}/products/${productId}/movements`,
  );
  return response.data.map(toProductMovementLine);
}

export async function listMovementCategoryOptionsApi(
  type?: "entrada" | "saida",
): Promise<Array<{ id: string; name: string; type: "entrada" | "saida" }>> {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<{ data: MovementCategoryOptionDto[] }>(
    `/v1/movement-categories/options${suffix}`,
  );
  return response.data;
}

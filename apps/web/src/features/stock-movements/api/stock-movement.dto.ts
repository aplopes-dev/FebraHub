/** DTOs HTTP de `/v1/stock-movements` e balanço. */

import type { StockMovementReason } from "../types/stock-movement-reason";

export type StockMovementListItemDto = {
  id: string;
  type: "entrada" | "saida";
  reason: StockMovementReason;
  categoryId: string | null;
  categoryName: string | null;
  stockId: string;
  stockName: string;
  operatedAt: string;
  itemsCount: number;
  totalCostCents: number;
  userName: string;
  createdAt: string;
};

export type StockMovementLineDto = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: string;
  costCents: number;
  subtotalCents: number;
};

export type StockMovementDetailDto = StockMovementListItemDto & {
  sourceType: string;
  sourceId: string | null;
  lines: StockMovementLineDto[];
};

export type StockMovementListResponseDto = {
  data: StockMovementListItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: {
    all: number;
    entrada: number;
    saida: number;
  };
};

export type StockMovementDetailResponseDto = {
  data: StockMovementDetailDto;
};

export type StockMovementCreatedResponseDto = {
  data: {
    id: string;
    type: "entrada" | "saida";
    reason: StockMovementReason;
    categoryId: string | null;
    stockId: string;
    operatedAt: string;
    itemsCount: number;
    totalCostCents: number;
    createdAt: string;
  };
};

export type CreateStockMovementPayload = {
  stockId: string;
  categoryId: string;
  type: "entrada" | "saida";
  operatedAt: string;
  lines: Array<{
    productId: string;
    quantity: string;
    costCents: number;
  }>;
};

export type StockBalanceItemDto = {
  productId: string;
  productName: string;
  productSku: string;
  /** Object key nunca vem; use `productImageProxyUrl(productId)` no mapper. */
  hasProductImage: boolean;
  quantity: string;
  unit: string;
  status: "ok" | "low" | "empty";
};

export type StockBalanceListResponseDto = {
  data: StockBalanceItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type ProductStockMovementLineDto = {
  movementId: string;
  type: "entrada" | "saida";
  reason: StockMovementReason;
  categoryName: string | null;
  operatedAt: string;
  quantity: string;
  costCents: number;
};

export type ProductStockMovementsResponseDto = {
  data: ProductStockMovementLineDto[];
};

export type MovementCategoryOptionDto = {
  id: string;
  name: string;
  type: "entrada" | "saida";
};

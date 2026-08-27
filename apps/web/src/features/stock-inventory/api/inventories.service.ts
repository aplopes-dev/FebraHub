"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  CreateInventoryPayload,
  InventoryCreatedResponseDto,
  InventoryDetailResponseDto,
  InventoryListResponseDto,
} from "@/features/stock-inventory/api/inventory.dto";
import {
  toInventoryDetail,
  toInventoryListItem,
} from "@/features/stock-inventory/api/inventory.mapper";
import type {
  Inventory,
  InventoryListItem,
} from "@/features/stock-inventory/types/inventory";

export type InventoryListParams = {
  stockId: string;
  page: number;
  perPage: number;
};

export type InventoryListResult = {
  data: InventoryListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export async function listInventoriesApi(
  params: InventoryListParams,
): Promise<InventoryListResult> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));

  const response = await apiFetch<InventoryListResponseDto>(
    `/v1/stocks/${params.stockId}/inventories?${query.toString()}`,
  );

  return {
    data: response.data.map(toInventoryListItem),
    meta: response.meta,
  };
}

export async function getInventoryByIdApi(id: string): Promise<Inventory> {
  const response = await apiFetch<InventoryDetailResponseDto>(
    `/v1/inventories/${id}`,
  );
  return toInventoryDetail(response.data);
}

export async function createInventoryApi(
  stockId: string,
  payload: CreateInventoryPayload,
): Promise<Inventory> {
  const response = await apiFetch<InventoryCreatedResponseDto>(
    `/v1/stocks/${stockId}/inventories`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return toInventoryDetail(response.data);
}

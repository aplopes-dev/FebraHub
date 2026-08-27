"use client";

import {
  ApiError,
  apiFetch,
} from "@/lib/api/client";
import type {
  PriceList,
  PriceListFormValues,
  PriceListItemPrice,
  PriceListListParams,
  PriceListListResult,
} from "@/features/price-lists/types/price-list";
import type {
  PriceListItemsResponseDto,
  PriceListListResponseDto,
  PriceListResponseDto,
} from "./price-list.dto";
import {
  priceListToFormValues,
  toPriceList,
  toPriceListItem,
  toReplaceItemsPayload,
  toSavePriceListPayload,
} from "./price-list.mapper";

function buildListQuery(params: PriceListListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listPriceLists(
  params: PriceListListParams,
): Promise<PriceListListResult> {
  const response = await apiFetch<PriceListListResponseDto>(
    `/v1/price-lists?${buildListQuery(params)}`,
  );
  return {
    data: response.data.map(toPriceList),
    meta: response.meta,
  };
}

/** Todas as listas ordenadas por prioridade (drawer Priorizar). */
export async function listAllPriceListsByPriority(): Promise<PriceList[]> {
  const response = await apiFetch<PriceListListResponseDto>(
    `/v1/price-lists?page=1&perPage=100`,
  );
  return response.data
    .map(toPriceList)
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "pt-BR"));
}

export async function getPriceListById(id: string): Promise<PriceList | null> {
  try {
    const response = await apiFetch<PriceListResponseDto>(
      `/v1/price-lists/${id}`,
    );
    return toPriceList(response.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createPriceList(
  values: PriceListFormValues,
): Promise<PriceList> {
  const response = await apiFetch<PriceListResponseDto>(
    "/v1/price-lists",
    {
      method: "POST",
      body: JSON.stringify(toSavePriceListPayload(values)),
    },
  );
  return toPriceList(response.data);
}

export async function updatePriceList(
  id: string,
  values: PriceListFormValues,
): Promise<PriceList> {
  const response = await apiFetch<PriceListResponseDto>(
    `/v1/price-lists/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toSavePriceListPayload(values)),
    },
  );
  return toPriceList(response.data);
}

export async function deletePriceList(id: string): Promise<void> {
  await apiFetch<void>(`/v1/price-lists/${id}`, { method: "DELETE" });
}

export async function reorderPriceLists(
  orderedIds: string[],
): Promise<PriceList[]> {
  const response = await apiFetch<{ data: PriceListListResponseDto["data"] }>(
    "/v1/price-lists/reorder",
    {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    },
  );
  return response.data.map(toPriceList);
}

export async function getPriceListItems(
  priceListId: string,
): Promise<PriceListItemPrice[]> {
  const response = await apiFetch<PriceListItemsResponseDto>(
    `/v1/price-lists/${priceListId}/items`,
  );
  return response.data.map(toPriceListItem);
}

export async function replacePriceListItems(
  priceListId: string,
  items: PriceListItemPrice[],
): Promise<PriceListItemPrice[]> {
  const response = await apiFetch<PriceListItemsResponseDto>(
    `/v1/price-lists/${priceListId}/items`,
    {
      method: "PUT",
      body: JSON.stringify(toReplaceItemsPayload(items)),
    },
  );
  return response.data.map(toPriceListItem);
}

export { priceListToFormValues };

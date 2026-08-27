"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getPriceListById,
  getPriceListItems,
  listAllPriceListsByPriority,
  listPriceLists,
} from "@/features/price-lists/api/price-lists.service";
import { priceListKeys } from "@/features/price-lists/hooks/query-keys";
import type { PriceListListParams } from "@/features/price-lists/types/price-list";

export function usePriceListsQuery(params: PriceListListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: priceListKeys.list(scope, params),
    queryFn: () => listPriceLists(params),
    enabled: ready,
  });
}

export function usePriceListsByPriorityQuery(enabled = true) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: priceListKeys.byPriority(scope),
    queryFn: () => listAllPriceListsByPriority(),
    enabled: ready && enabled,
  });
}

export function usePriceListQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: priceListKeys.detail(scope, id),
    queryFn: () => getPriceListById(id),
    enabled: ready && Boolean(id),
  });
}

export function usePriceListItemsQuery(priceListId: string, enabled = true) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: priceListKeys.items(scope, priceListId),
    queryFn: () => getPriceListItems(priceListId),
    enabled: ready && Boolean(priceListId) && enabled,
  });
}

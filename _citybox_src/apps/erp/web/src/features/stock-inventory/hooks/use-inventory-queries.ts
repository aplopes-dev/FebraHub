"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getInventoryByIdApi,
  listInventoriesApi,
  type InventoryListParams,
} from "@/features/stock-inventory/api/inventories.service";
import { inventoryKeys } from "@/features/stock-inventory/hooks/query-keys";

export function useInventoriesQuery(params: InventoryListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: inventoryKeys.list(scope, params),
    queryFn: () => listInventoriesApi(params),
    enabled: ready && Boolean(params.stockId),
  });
}

export function useInventoryQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: inventoryKeys.detail(scope, id),
    queryFn: () => getInventoryByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

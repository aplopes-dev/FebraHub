import type { InventoryListParams } from "@/features/stock-inventory/api/inventories.service";

export const inventoryKeys = {
  all: (scope: string) => ["comercio", "inventories", scope] as const,
  lists: (scope: string) => [...inventoryKeys.all(scope), "list"] as const,
  list: (scope: string, params: InventoryListParams) =>
    [...inventoryKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...inventoryKeys.all(scope), "detail", id] as const,
};

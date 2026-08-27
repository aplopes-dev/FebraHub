import type { PriceListListParams } from "@/features/price-lists/types/price-list";

export const priceListKeys = {
  all: (scope: string) => ["api", "price-lists", scope] as const,
  lists: (scope: string) => [...priceListKeys.all(scope), "list"] as const,
  list: (scope: string, params: PriceListListParams) =>
    [...priceListKeys.lists(scope), params] as const,
  byPriority: (scope: string) =>
    [...priceListKeys.all(scope), "by-priority"] as const,
  detail: (scope: string, id: string) =>
    [...priceListKeys.all(scope), "detail", id] as const,
  items: (scope: string, id: string) =>
    [...priceListKeys.all(scope), "items", id] as const,
};

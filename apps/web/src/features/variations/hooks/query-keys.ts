import type { VariationListParams } from "@/features/variations/types/variation";

export const variationKeys = {
  all: (scope: string) => ["api", "variations", scope] as const,
  lists: (scope: string) => [...variationKeys.all(scope), "list"] as const,
  list: (scope: string, params: VariationListParams) =>
    [...variationKeys.lists(scope), params] as const,
  catalog: (scope: string) =>
    [...variationKeys.all(scope), "catalog"] as const,
  detail: (scope: string, id: string) =>
    [...variationKeys.all(scope), "detail", id] as const,
};

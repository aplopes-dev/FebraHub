import type { MovementCategoryListParams } from "@/features/movement-categories/types/movement-category";

export const movementCategoryKeys = {
  all: (scope: string) =>
    ["comercio", "movement-categories", scope] as const,
  lists: (scope: string) =>
    [...movementCategoryKeys.all(scope), "list"] as const,
  list: (scope: string, params: MovementCategoryListParams) =>
    [...movementCategoryKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...movementCategoryKeys.all(scope), "detail", id] as const,
};

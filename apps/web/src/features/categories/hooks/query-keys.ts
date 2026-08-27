import type { CategoryListParams } from "@/features/categories/types/category";

export const categoryKeys = {
  all: (scope: string) => ["api", "categories", scope] as const,
  lists: (scope: string) => [...categoryKeys.all(scope), "list"] as const,
  list: (scope: string, params: CategoryListParams) =>
    [...categoryKeys.lists(scope), params] as const,
};

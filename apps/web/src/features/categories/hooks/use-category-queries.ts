"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listCategories } from "@/features/categories/api/categories.service";
import { categoryKeys } from "@/features/categories/hooks/query-keys";
import type { CategoryListParams } from "@/features/categories/types/category";

export function useCategoriesQuery(params: CategoryListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: categoryKeys.list(scope, params),
    queryFn: () => listCategories(params),
    enabled: ready,
  });
}

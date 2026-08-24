"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getMovementCategoryByIdApi,
  listMovementCategoriesApi,
} from "@/features/movement-categories/api/movement-categories.service";
import { movementCategoryKeys } from "@/features/movement-categories/hooks/query-keys";
import type { MovementCategoryListParams } from "@/features/movement-categories/types/movement-category";

export function useMovementCategoriesQuery(params: MovementCategoryListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: movementCategoryKeys.list(scope, params),
    queryFn: () => listMovementCategoriesApi(params),
    enabled: ready,
  });
}

export function useMovementCategoryQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: movementCategoryKeys.detail(scope, id),
    queryFn: () => getMovementCategoryByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

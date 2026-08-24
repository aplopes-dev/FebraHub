"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  listAllCustomerCategories,
  listCustomerCategories,
} from "@/features/customer-categories/api/customer-categories.service";
import { customerCategoryKeys } from "@/features/customers/hooks/query-keys";
import type { CustomerCategoryListParams } from "@/features/customer-categories/types/customer-category";

export function useCustomerCategoriesQuery(params: CustomerCategoryListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: customerCategoryKeys.list(scope, params),
    queryFn: () => listCustomerCategories(params),
    enabled: ready,
  });
}

/** Categorias para autocomplete / filtros. */
export function useAllCustomerCategoriesQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: customerCategoryKeys.allItems(scope),
    queryFn: () => listAllCustomerCategories(),
    enabled: ready,
    staleTime: 5 * 60_000,
  });
}

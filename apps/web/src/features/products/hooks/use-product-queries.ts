"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { productKeys } from "@/features/products/hooks/query-keys";
import {
  getProductById,
  listAllProducts,
  listProductCategories,
  listProducts,
  listUnitsOfMeasure,
} from "@/features/products/api/products.service";
import type { ProductListParams } from "@/features/products/types/product";

export function useProductsQuery(params: ProductListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productKeys.list(scope, params),
    queryFn: () => listProducts(params),
    // Sem `keepPreviousData` de propósito: o `DataTableSkeleton` cobre toda
    // troca de página/filtro via `isFetching` — preferimos o feedback de
    // carregamento explícito a manter a página anterior visível.
    // `ready` evita disparar antes de a organização/unidade ativa ser resolvida.
    enabled: ready,
  });
}

export function useProductQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productKeys.detail(scope, id),
    queryFn: () => getProductById(id),
    enabled: ready && Boolean(id),
    retry: false, // 404 é resposta legítima ("produto não encontrado")
  });
}

export function useProductCategoriesQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productKeys.categories(scope),
    queryFn: () => listProductCategories(),
    enabled: ready,
    staleTime: 5 * 60_000, // catálogo de apoio muda pouco
  });
}

export function useUnitsOfMeasureQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productKeys.units(scope),
    queryFn: () => listUnitsOfMeasure(),
    enabled: ready,
    staleTime: 5 * 60_000,
  });
}

export function useCatalogProductsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productKeys.catalogAll(scope),
    queryFn: () => listAllProducts(),
    enabled: ready,
    staleTime: 60_000,
  });
}

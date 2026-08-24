"use client";

import { useEffect, useMemo } from "react";
import { useProductListStore } from "@/features/products/store/product-list.store";
import { useProductsQuery } from "@/features/products/hooks/use-product-queries";
import type {
  ProductListParams,
  ProductListResult,
} from "@/features/products/types/product";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: ProductListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: 10, totalPages: 1 },
  tabCounts: { all: 0, with_variants: 0, supplies: 0, deleted: 0 },
};

/**
 * Compõe o estado de UI (Zustand) com os dados de servidor (React Query).
 *
 * A interface de retorno é a mesma de quando a listagem era mock, então
 * `ProductListPage` e `ProductListTable` não precisaram mudar — só ganharam
 * `isLoading`/`isError`.
 */
export function useProductList() {
  const tab = useProductListStore((state) => state.tab);
  const search = useProductListStore((state) => state.search);
  const debouncedSearch = useProductListStore((state) => state.debouncedSearch);
  const filters = useProductListStore((state) => state.filters);
  const sort = useProductListStore((state) => state.sort);
  const page = useProductListStore((state) => state.page);
  const perPage = useProductListStore((state) => state.perPage);
  const selectedIds = useProductListStore((state) => state.selectedIds);

  const setTab = useProductListStore((state) => state.setTab);
  const setSearchValue = useProductListStore((state) => state.setSearch);
  const commitSearch = useProductListStore((state) => state.commitSearch);
  const setFilters = useProductListStore((state) => state.setFilters);
  const setSort = useProductListStore((state) => state.setSort);
  const setPage = useProductListStore((state) => state.setPage);
  const setPerPage = useProductListStore((state) => state.setPerPage);
  const toggleSelectOne = useProductListStore((state) => state.toggleSelectOne);
  const setPageSelection = useProductListStore(
    (state) => state.setPageSelection,
  );
  const clearSelection = useProductListStore((state) => state.clearSelection);

  // Debounce da busca (política §8.1: nunca mandar o valor do input direto).
  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo<ProductListParams>(
    () => ({ tab, search: debouncedSearch, filters, sort, page, perPage }),
    [tab, debouncedSearch, filters, sort, page, perPage],
  );

  const query = useProductsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  const pageIds = useMemo(
    () => result.data.map((product) => product.id),
    [result.data],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function toggleSelectAllPage() {
    setPageSelection(pageIds, !allPageSelected);
  }

  return {
    tab,
    setTab,
    search,
    setSearch: setSearchValue,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    clearSelection,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

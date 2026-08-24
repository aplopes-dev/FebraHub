"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptyFiscalParameterFilters } from "@/features/fiscal-parameters/lib/fiscal-parameters-filters";
import { useFiscalParametersListQuery } from "@/features/fiscal-parameters/hooks/use-fiscal-parameters-queries";
import { useProductCategoriesQuery } from "@/features/products/hooks/use-product-queries";
import type {
  FiscalParameterListFilters,
  FiscalParameterListResult,
  FiscalParameterListTab,
  FiscalParameterSortOption,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;
export const ALL_CATEGORIES = "__all__";

const EMPTY_RESULT: FiscalParameterListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { all: 0, pending: 0 },
};

export function useFiscalParametersList() {
  const categoriesQuery = useProductCategoriesQuery();
  const categories = useMemo(
    () => (categoriesQuery.data ?? []).map((category) => category.name),
    [categoriesQuery.data],
  );

  const [tab, setTabState] = useState<FiscalParameterListTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategoryState] = useState<string>(ALL_CATEGORIES);
  const [filters, setFiltersState] = useState<FiscalParameterListFilters>(
    createEmptyFiscalParameterFilters,
  );
  const [sort, setSortState] =
    useState<FiscalParameterSortOption>("name_asc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listQuery = useFiscalParametersListQuery({
    tab,
    search: debouncedSearch,
    category: category === ALL_CATEGORIES ? "" : category,
    filters,
    sort,
    page,
    perPage,
  });

  const result = listQuery.data ?? EMPTY_RESULT;

  function setTab(next: FiscalParameterListTab) {
    setTabState(next);
    setPageState(1);
  }

  function setCategory(next: string) {
    setCategoryState(next);
    setPageState(1);
  }

  function setFilters(next: FiscalParameterListFilters) {
    setFiltersState(next);
    setPageState(1);
  }

  function setSort(next: FiscalParameterSortOption) {
    setSortState(next);
    setPageState(1);
  }

  function setPage(next: number) {
    setPageState(next);
  }

  function setPerPage(next: number) {
    setPerPageState(next);
    setPageState(1);
  }

  return {
    tab,
    setTab,
    search,
    setSearch,
    category,
    setCategory,
    categories,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
  };
}

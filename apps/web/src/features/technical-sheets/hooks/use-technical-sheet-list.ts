"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptyTechnicalSheetFilters } from "@/features/technical-sheets/lib/technical-sheet-filters";
import { useTechnicalSheetsListQuery } from "@/features/technical-sheets/hooks/use-technical-sheet-queries";
import { useProductCategoriesQuery } from "@/features/products/hooks/use-product-queries";
import type {
  TechnicalSheetListFilters,
  TechnicalSheetListResult,
  TechnicalSheetListTab,
  TechnicalSheetSortOption,
} from "@/features/technical-sheets/types/technical-sheet";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;
export const ALL_CATEGORIES = "__all__";

const EMPTY_RESULT: TechnicalSheetListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { all: 0, production: 0 },
};

export function useTechnicalSheetList() {
  const categoriesQuery = useProductCategoriesQuery();
  const categories = useMemo(
    () => (categoriesQuery.data ?? []).map((category) => category.name),
    [categoriesQuery.data],
  );

  const [tab, setTabState] = useState<TechnicalSheetListTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategoryState] = useState<string>(ALL_CATEGORIES);
  const [filters, setFiltersState] = useState<TechnicalSheetListFilters>(
    createEmptyTechnicalSheetFilters,
  );
  const [sort, setSortState] = useState<TechnicalSheetSortOption>("name_asc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listQuery = useTechnicalSheetsListQuery({
    tab,
    search: debouncedSearch,
    category: category === ALL_CATEGORIES ? "" : category,
    filters,
    sort,
    page,
    perPage,
  });

  const result = listQuery.data ?? EMPTY_RESULT;

  function setTab(next: TechnicalSheetListTab) {
    setTabState(next);
    setPageState(1);
  }

  function setCategory(next: string) {
    setCategoryState(next);
    setPageState(1);
  }

  function setFilters(next: TechnicalSheetListFilters) {
    setFiltersState(next);
    setPageState(1);
  }

  function setSort(next: TechnicalSheetSortOption) {
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

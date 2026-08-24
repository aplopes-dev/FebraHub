"use client";

import { useEffect, useMemo } from "react";
import { useCategoryListStore } from "@/features/categories/store/category-list.store";
import { useCategoriesQuery } from "@/features/categories/hooks/use-category-queries";
import type { CategoryListResult } from "@/features/categories/types/category";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CategoryListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: 10, totalPages: 1 },
};

export function useCategoryList() {
  const search = useCategoryListStore((state) => state.search);
  const debouncedSearch = useCategoryListStore((state) => state.debouncedSearch);
  const page = useCategoryListStore((state) => state.page);
  const perPage = useCategoryListStore((state) => state.perPage);

  const setSearch = useCategoryListStore((state) => state.setSearch);
  const commitSearch = useCategoryListStore((state) => state.commitSearch);
  const setPage = useCategoryListStore((state) => state.setPage);
  const setPerPage = useCategoryListStore((state) => state.setPerPage);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      page,
      perPage,
    }),
    [debouncedSearch, page, perPage],
  );

  const query = useCategoriesQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  return {
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

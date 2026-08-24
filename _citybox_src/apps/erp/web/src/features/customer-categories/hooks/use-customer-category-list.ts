"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  useCustomerCategoryListStore,
} from "@/features/customer-categories/store/customer-category-list.store";
import { useCustomerCategoriesQuery } from "@/features/customer-categories/hooks/use-customer-category-queries";
import type { CustomerCategoryListResult } from "@/features/customer-categories/types/customer-category";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CustomerCategoryListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
};

export function useCustomerCategoryList() {
  const search = useCustomerCategoryListStore((state) => state.search);
  const debouncedSearch = useCustomerCategoryListStore(
    (state) => state.debouncedSearch,
  );
  const page = useCustomerCategoryListStore((state) => state.page);
  const perPage = useCustomerCategoryListStore((state) => state.perPage);

  const setSearch = useCustomerCategoryListStore((state) => state.setSearch);
  const commitSearch = useCustomerCategoryListStore(
    (state) => state.commitSearch,
  );
  const setPage = useCustomerCategoryListStore((state) => state.setPage);
  const setPerPage = useCustomerCategoryListStore((state) => state.setPerPage);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo(
    () => ({ search: debouncedSearch, page, perPage }),
    [debouncedSearch, page, perPage],
  );

  const query = useCustomerCategoriesQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  return {
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

"use client";

import { useEffect, useMemo } from "react";
import { usePriceListListStore } from "@/features/price-lists/store/price-list-list.store";
import { usePriceListsQuery } from "@/features/price-lists/hooks/use-price-list-queries";
import type { PriceListListResult } from "@/features/price-lists/types/price-list";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: PriceListListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: 10, totalPages: 1 },
};

export function usePriceListList() {
  const search = usePriceListListStore((state) => state.search);
  const debouncedSearch = usePriceListListStore(
    (state) => state.debouncedSearch,
  );
  const page = usePriceListListStore((state) => state.page);
  const perPage = usePriceListListStore((state) => state.perPage);

  const setSearch = usePriceListListStore((state) => state.setSearch);
  const commitSearch = usePriceListListStore((state) => state.commitSearch);
  const setPage = usePriceListListStore((state) => state.setPage);
  const setPerPage = usePriceListListStore((state) => state.setPerPage);

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

  const query = usePriceListsQuery(params);
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

"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  useCarrierListStore,
} from "@/features/carriers/store/carrier-list.store";
import { useCarriersQuery } from "@/features/carriers/hooks/use-carrier-queries";
import type { CarrierListResult } from "@/features/carriers/types/carrier";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CarrierListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useCarrierList() {
  const tab = useCarrierListStore((state) => state.tab);
  const search = useCarrierListStore((state) => state.search);
  const debouncedSearch = useCarrierListStore((state) => state.debouncedSearch);
  const page = useCarrierListStore((state) => state.page);
  const perPage = useCarrierListStore((state) => state.perPage);

  const setTab = useCarrierListStore((state) => state.setTab);
  const setSearch = useCarrierListStore((state) => state.setSearch);
  const commitSearch = useCarrierListStore((state) => state.commitSearch);
  const setPage = useCarrierListStore((state) => state.setPage);
  const setPerPage = useCarrierListStore((state) => state.setPerPage);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo(
    () => ({ tab, search: debouncedSearch, page, perPage }),
    [tab, debouncedSearch, page, perPage],
  );

  const query = useCarriersQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  return {
    tab,
    setTab,
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    /** Recarrega a listagem sob demanda; as mutações já invalidam o cache. */
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

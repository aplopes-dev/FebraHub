"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  useSupplierListStore,
} from "@/features/suppliers/store/supplier-list.store";
import { useSuppliersQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import type { SupplierListResult } from "@/features/suppliers/types/supplier";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: SupplierListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useSupplierList() {
  const tab = useSupplierListStore((state) => state.tab);
  const search = useSupplierListStore((state) => state.search);
  const debouncedSearch = useSupplierListStore((state) => state.debouncedSearch);
  const page = useSupplierListStore((state) => state.page);
  const perPage = useSupplierListStore((state) => state.perPage);

  const setTab = useSupplierListStore((state) => state.setTab);
  const setSearch = useSupplierListStore((state) => state.setSearch);
  const commitSearch = useSupplierListStore((state) => state.commitSearch);
  const setPage = useSupplierListStore((state) => state.setPage);
  const setPerPage = useSupplierListStore((state) => state.setPerPage);

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

  const query = useSuppliersQuery(params);
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

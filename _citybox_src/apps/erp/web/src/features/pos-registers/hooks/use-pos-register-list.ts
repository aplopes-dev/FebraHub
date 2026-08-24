"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  usePosRegisterListStore,
} from "@/features/pos-registers/store/pos-register-list.store";
import { usePosTerminalsQuery } from "@/features/pos-registers/hooks/use-pos-terminal-queries";
import type { PosRegisterListResult } from "@/features/pos-registers/types/pos-register";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: PosRegisterListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
};

export function usePosRegisterList() {
  const search = usePosRegisterListStore((state) => state.search);
  const debouncedSearch = usePosRegisterListStore(
    (state) => state.debouncedSearch,
  );
  const page = usePosRegisterListStore((state) => state.page);
  const perPage = usePosRegisterListStore((state) => state.perPage);

  const setSearch = usePosRegisterListStore((state) => state.setSearch);
  const commitSearch = usePosRegisterListStore((state) => state.commitSearch);
  const setPage = usePosRegisterListStore((state) => state.setPage);
  const setPerPage = usePosRegisterListStore((state) => state.setPerPage);

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

  const query = usePosTerminalsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  return {
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

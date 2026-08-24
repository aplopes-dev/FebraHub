"use client";

import { useEffect, useMemo } from "react";
import { useUnitOfMeasureListStore } from "@/features/unit-of-measure/store/unit-of-measure-list.store";
import { useUnitsOfMeasureQuery } from "@/features/unit-of-measure/hooks/use-unit-of-measure-queries";
import type { UnitOfMeasureListResult } from "@/features/unit-of-measure/types/unit-of-measure";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: UnitOfMeasureListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: 10, totalPages: 1 },
};

export function useUnitOfMeasureList() {
  const search = useUnitOfMeasureListStore((state) => state.search);
  const debouncedSearch = useUnitOfMeasureListStore(
    (state) => state.debouncedSearch,
  );
  const page = useUnitOfMeasureListStore((state) => state.page);
  const perPage = useUnitOfMeasureListStore((state) => state.perPage);

  const setSearch = useUnitOfMeasureListStore((state) => state.setSearch);
  const commitSearch = useUnitOfMeasureListStore((state) => state.commitSearch);
  const setPage = useUnitOfMeasureListStore((state) => state.setPage);
  const setPerPage = useUnitOfMeasureListStore((state) => state.setPerPage);

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

  const query = useUnitsOfMeasureQuery(params);
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

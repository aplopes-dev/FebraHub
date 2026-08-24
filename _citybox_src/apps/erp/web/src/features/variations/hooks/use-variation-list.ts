"use client";

import { useEffect, useMemo, useState } from "react";
import { useVariationListStore } from "@/features/variations/store/variation-list.store";
import { useVariationsQuery } from "@/features/variations/hooks/use-variation-queries";
import type { VariationListResult } from "@/features/variations/types/variation";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: VariationListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: 10, totalPages: 1 },
};

export function useVariationList() {
  const search = useVariationListStore((state) => state.search);
  const debouncedSearch = useVariationListStore(
    (state) => state.debouncedSearch,
  );
  const page = useVariationListStore((state) => state.page);
  const perPage = useVariationListStore((state) => state.perPage);

  const setSearch = useVariationListStore((state) => state.setSearch);
  const commitSearch = useVariationListStore((state) => state.commitSearch);
  const setPageStore = useVariationListStore((state) => state.setPage);
  const setPerPageStore = useVariationListStore((state) => state.setPerPage);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(() => {
      commitSearch(search);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
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

  const query = useVariationsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  const pageIds = useMemo(
    () => result.data.map((variation) => variation.id),
    [result.data],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function setPage(next: number) {
    setPageStore(next);
    setSelectedIds(new Set());
  }

  function setPerPage(next: number) {
    setPerPageStore(next);
    setSelectedIds(new Set());
  }

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of pageIds) next.add(id);
      return next;
    });
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    search,
    setSearch,
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
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

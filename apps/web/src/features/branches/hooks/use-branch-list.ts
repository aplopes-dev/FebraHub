"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  useBranchListStore,
} from "@/features/branches/store/branch-list.store";
import { useBranchesQuery } from "@/features/branches/hooks/use-branch-queries";
import type { BranchListResult } from "@/features/branches/types/branch";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: BranchListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
};

export function useBranchList() {
  const search = useBranchListStore((state) => state.search);
  const debouncedSearch = useBranchListStore((state) => state.debouncedSearch);
  const page = useBranchListStore((state) => state.page);
  const perPage = useBranchListStore((state) => state.perPage);
  const selectedIds = useBranchListStore((state) => state.selectedIds);

  const setSearch = useBranchListStore((state) => state.setSearch);
  const commitSearch = useBranchListStore((state) => state.commitSearch);
  const setPage = useBranchListStore((state) => state.setPage);
  const setPerPage = useBranchListStore((state) => state.setPerPage);
  const toggleSelected = useBranchListStore((state) => state.toggleSelected);
  const setSelected = useBranchListStore((state) => state.setSelected);

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

  const query = useBranchesQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageIds = result.data.map((branch) => branch.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id));
  const somePageSelected = pageIds.some((id) => selectedSet.has(id));

  function toggleSelectAllPage() {
    if (allPageSelected) {
      setSelected(selectedIds.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelected([...new Set([...selectedIds, ...pageIds])]);
  }

  return {
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds: selectedSet,
    toggleSelected,
    toggleSelectAllPage,
    allPageSelected,
    somePageSelected,
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

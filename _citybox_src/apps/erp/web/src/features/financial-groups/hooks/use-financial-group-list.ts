"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinancialGroupsQuery } from "@/features/financial-groups/hooks/use-financial-group-queries";
import type {
  FinancialGroupListResult,
  FinancialGroupListTab,
  FinancialGroupTypeFilter,
} from "@/features/financial-groups/types/financial-group";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: FinancialGroupListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useFinancialGroupList() {
  const [tab, setTabState] = useState<FinancialGroupListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setTypeState] = useState<FinancialGroupTypeFilter>("all");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({
      tab,
      search: debouncedSearch,
      type,
      page,
      perPage,
    }),
    [tab, debouncedSearch, type, page, perPage],
  );

  const query = useFinancialGroupsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  function setTab(next: FinancialGroupListTab) {
    setTabState(next);
    setPageState(1);
  }

  function setType(next: FinancialGroupTypeFilter) {
    setTypeState(next);
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
    type,
    setType,
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

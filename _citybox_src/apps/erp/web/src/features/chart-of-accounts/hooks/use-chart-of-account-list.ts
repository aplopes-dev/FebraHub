"use client";

import { useEffect, useMemo, useState } from "react";
import { useChartOfAccountsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-queries";
import type {
  ChartOfAccountListResult,
  ChartOfAccountListTab,
} from "@/features/chart-of-accounts/types/chart-of-account";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: ChartOfAccountListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useChartOfAccountList() {
  const [tab, setTabState] = useState<ChartOfAccountListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
      page,
      perPage,
    }),
    [tab, debouncedSearch, page, perPage],
  );

  const query = useChartOfAccountsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  function setTab(next: ChartOfAccountListTab) {
    setTabState(next);
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

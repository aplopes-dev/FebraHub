"use client";

import { useEffect, useMemo, useState } from "react";
import { useCostCentersQuery } from "@/features/cost-centers/hooks/use-cost-center-queries";
import type {
  CostCenterListResult,
  CostCenterListTab,
} from "@/features/cost-centers/types/cost-center";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CostCenterListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useCostCenterList() {
  const [tab, setTabState] = useState<CostCenterListTab>("active");
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

  const query = useCostCentersQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  function setTab(next: CostCenterListTab) {
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

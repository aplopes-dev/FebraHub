"use client";

import { useEffect, useMemo, useState } from "react";
import { useCardContractsQuery } from "@/features/card-contracts/hooks/use-card-contract-queries";
import type {
  CardContractListResult,
  CardContractListTab,
} from "@/features/card-contracts/types/card-contract";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CardContractListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useCardContractList() {
  const [tab, setTabState] = useState<CardContractListTab>("active");
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

  const query = useCardContractsQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  function setTab(next: CardContractListTab) {
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

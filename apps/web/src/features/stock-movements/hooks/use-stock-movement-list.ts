"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStockMovementsQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";
import type { StockMovementListTab } from "@/features/stock-movements/types/stock-movement";
import type { StockMovementReason } from "@/features/stock-movements/types/stock-movement-reason";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_TAB_COUNTS = { all: 0, entrada: 0, saida: 0 } as const;

export function useStockMovementList() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const [tab, setTabState] = useState<StockMovementListTab>("all");
  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const [reason, setReasonState] = useState<StockMovementReason | null>(null);
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(searchFromUrl);

  // Ajusta o estado quando a URL muda (deep-link `?search=`), sem useEffect.
  if (searchFromUrl !== syncedUrlSearch) {
    setSyncedUrlSearch(searchFromUrl);
    setSearch(searchFromUrl);
    setDebouncedSearch(searchFromUrl);
  }

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  const query = useStockMovementsQuery({
    tab,
    search: debouncedSearch,
    reason,
    page,
    perPage,
  });

  function setTab(next: StockMovementListTab) {
    setTabState(next);
    setPageState(1);
  }

  function setReason(next: StockMovementReason | null) {
    setReasonState(next);
    setPageState(1);
  }

  function setPage(next: number) {
    setPageState(next);
  }

  function setPerPage(next: number) {
    setPerPageState(next);
    setPageState(1);
  }

  const result = query.data ?? {
    data: [],
    meta: {
      total: 0,
      page,
      perPage,
      totalPages: 1,
    },
    tabCounts: EMPTY_TAB_COUNTS,
  };

  return {
    tab,
    setTab,
    search,
    setSearch,
    reason,
    setReason,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

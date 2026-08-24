"use client";

import { useEffect, useState } from "react";
import { createEmptyStockTransferFilters } from "@/features/stock-transfers/lib/stock-transfer-filters";
import { useStockTransfersQuery } from "@/features/stock-transfers/hooks/use-stock-transfer-queries";
import { useCancelStockTransferMutation } from "@/features/stock-transfers/hooks/use-stock-transfer-mutations";
import type {
  StockTransferListFilters,
  StockTransferListTab,
} from "@/features/stock-transfers/types/stock-transfer";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_TAB_COUNTS = { active: 0, cancelled: 0 } as const;

export function useStockTransferList() {
  const [tab, setTabState] = useState<StockTransferListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<StockTransferListFilters>(
    createEmptyStockTransferFilters,
  );
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  const cancelMutation = useCancelStockTransferMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useStockTransfersQuery({
    tab,
    search: debouncedSearch,
    filters,
    page,
    perPage,
  });

  function resetPage() {
    setPageState(1);
  }

  function setTab(next: StockTransferListTab) {
    setTabState(next);
    resetPage();
  }

  function setFilters(next: StockTransferListFilters) {
    setFiltersState(next);
    resetPage();
  }

  function setPage(next: number) {
    setPageState(next);
  }

  function setPerPage(next: number) {
    setPerPageState(next);
    resetPage();
  }

  async function cancel(id: string): Promise<boolean> {
    try {
      await cancelMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
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
    filters,
    setFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    cancel,
    isCancelling: cancelMutation.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: query.refetch,
  };
}

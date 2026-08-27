"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptySaleOrderFilters } from "@/features/sales-orders/lib/sale-order-filters";
import { useSaleOrdersQuery } from "@/features/sales-orders/hooks/use-sale-order-queries";
import {
  useDeleteSaleOrderMutation,
  usePatchSaleOrderStatusMutation,
} from "@/features/sales-orders/hooks/use-sale-order-mutations";
import type {
  SaleOrderListFilters,
  SaleOrderListTab,
  SaleOrderSortOption,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_TAB_COUNTS = { open: 0, deleted: 0 } as const;

export function useSaleOrderList() {
  const [tab, setTabState] = useState<SaleOrderListTab>("open");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<SaleOrderListFilters>(
    createEmptySaleOrderFilters,
  );
  const [sort, setSortState] =
    useState<SaleOrderSortOption>("created_at_desc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const deleteMutation = useDeleteSaleOrderMutation();
  const statusMutation = usePatchSaleOrderStatusMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useSaleOrdersQuery({
    tab,
    search: debouncedSearch,
    filters,
    sort,
    page,
    perPage,
  });

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

  const pageIds = useMemo(
    () => result.data.map((order) => order.id),
    [result.data],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function resetListState() {
    setPageState(1);
    setSelectedIds(new Set());
  }

  function setTab(next: SaleOrderListTab) {
    setTabState(next);
    resetListState();
  }

  function setFilters(next: SaleOrderListFilters) {
    setFiltersState(next);
    resetListState();
  }

  function setSort(next: SaleOrderSortOption) {
    setSortState(next);
    resetListState();
  }

  function setPage(next: number) {
    setPageState(next);
    setSelectedIds(new Set());
  }

  function setPerPage(next: number) {
    setPerPageState(next);
    resetListState();
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

  function changeStatus(id: string, status: SaleOrderStatus): boolean {
    statusMutation.mutate({ id, status });
    return true;
  }

  function removeOrder(id: string): boolean {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
    return true;
  }

  return {
    tab,
    setTab,
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading: query.isLoading,
    isError: query.isError,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    changeStatus,
    removeOrder,
  };
}

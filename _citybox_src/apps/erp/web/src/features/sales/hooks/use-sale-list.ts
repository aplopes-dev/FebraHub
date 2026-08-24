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

/** Lista de vendas: mesmos endpoints de pedidos, só não-excluídos. */
export function useSaleList() {
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useSaleOrdersQuery({
    tab: "open" as SaleOrderListTab,
    search: debouncedSearch,
    filters,
    sort,
    page,
    perPage,
  });

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
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

  return {
    search,
    setSearch,
    filters,
    setFilters: (next: SaleOrderListFilters) => {
      setFiltersState(next);
      resetListState();
    },
    sort,
    setSort: (next: SaleOrderSortOption) => {
      setSortState(next);
      resetListState();
    },
    page,
    setPage: (next: number) => {
      setPageState(next);
      setSelectedIds(new Set());
    },
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      resetListState();
    },
    result,
    isLoading: query.isLoading,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage: () => {
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
    },
    toggleSelectOne: (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    removeOne: (id: string): boolean => {
      deleteMutation.mutate(id);
      return true;
    },
  };
}

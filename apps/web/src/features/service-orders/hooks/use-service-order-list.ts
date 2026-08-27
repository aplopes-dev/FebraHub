"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/ui";
import { createEmptyServiceOrderFilters } from "@/features/service-orders/lib/service-order-filters";
import { useServiceOrderMutations } from "@/features/service-orders/hooks/use-service-order-mutations";
import {
  useServiceOrdersQuery,
  useServiceOrderStatusesQuery,
} from "@/features/service-orders/hooks/use-service-order-queries";
import type {
  ServiceOrderListFilters,
  ServiceOrderListTab,
  ServiceOrderSortOption,
} from "@/features/service-orders/types/service-order";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_TAB_COUNTS = {
  open: 0,
  in_progress: 0,
  ready: 0,
  closed: 0,
  canceled: 0,
} as const;

export function useServiceOrderList() {
  const [tab, setTabState] = useState<ServiceOrderListTab>("open");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<ServiceOrderListFilters>(
    createEmptyServiceOrderFilters,
  );
  const [sort, setSortState] =
    useState<ServiceOrderSortOption>("opened_at_desc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Hidrata cache sync de status (badges / selects)
  useServiceOrderStatusesQuery();
  const mutations = useServiceOrderMutations();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useServiceOrdersQuery({
    tab,
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
    tab,
    setTab: (next: ServiceOrderListTab) => {
      setTabState(next);
      resetListState();
    },
    search,
    setSearch,
    filters,
    setFilters: (next: ServiceOrderListFilters) => {
      setFiltersState(next);
      resetListState();
    },
    sort,
    setSort: (next: ServiceOrderSortOption) => {
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
    cancelOne: (_id: string): boolean => {
      toast.info("Cancele alterando o status da OS no formulário.");
      return false;
    },
    generateSale: (id: string) => {
      mutations.generateSale.mutate(id);
      return true;
    },
    refresh: () => {
      void query.refetch();
    },
  };
}

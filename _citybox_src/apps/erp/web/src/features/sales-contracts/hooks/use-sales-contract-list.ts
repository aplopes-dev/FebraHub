"use client";

import { useEffect, useMemo, useState } from "react";
import { createEmptySalesContractFilters } from "@/features/sales-contracts/lib/sales-contract-filters";
import {
  useSalesContractMutations,
  useSalesContractsQuery,
} from "@/features/sales-contracts/hooks/use-sales-contract-queries";
import type {
  SalesContractListFilters,
  SalesContractListTab,
  SalesContractSortOption,
} from "@/features/sales-contracts/types/sales-contract";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const EMPTY_TAB_COUNTS = { active: 0, deleted: 0 } as const;

export function useSalesContractList() {
  const [tab, setTabState] = useState<SalesContractListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState(createEmptySalesContractFilters);
  const [sort, setSortState] =
    useState<SalesContractSortOption>("number_desc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const mutations = useSalesContractMutations();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useSalesContractsQuery({
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
    () => result.data.map((contract) => contract.id),
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
    setTab: (next: SalesContractListTab) => {
      setTabState(next);
      resetListState();
    },
    search,
    setSearch,
    filters,
    setFilters: (next: SalesContractListFilters) => {
      setFiltersState(next);
      resetListState();
    },
    sort,
    setSort: (next: SalesContractSortOption) => {
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
    removeContract: (id: string): boolean => {
      mutations.remove.mutate(id);
      return true;
    },
    restoreContract: (_id: string): boolean => false,
    refresh: () => {
      void query.refetch();
    },
  };
}

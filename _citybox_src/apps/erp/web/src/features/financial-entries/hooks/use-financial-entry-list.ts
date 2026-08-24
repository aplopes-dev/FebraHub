"use client";

import { useEffect, useState } from "react";
import { createEmptyFinancialEntryFilters } from "@/features/financial-entries/lib/financial-entry-filters";
import { useFinancialEntriesQuery } from "@/features/financial-entries/hooks/use-financial-entry-queries";
import {
  useDeleteFinancialEntryMutation,
  useRestoreFinancialEntryMutation,
} from "@/features/financial-entries/hooks/use-financial-entry-mutations";
import type {
  FinancialEntryListFilters,
  FinancialEntryListTab,
  FinancialEntrySortOption,
} from "@/features/financial-entries/types/financial-entry";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function useFinancialEntryList() {
  const [tab, setTabState] = useState<FinancialEntryListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<FinancialEntryListFilters>(
    createEmptyFinancialEntryFilters,
  );
  const [sort, setSortState] =
    useState<FinancialEntrySortOption>("due_date_asc");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = { search: debouncedSearch, filters, sort, tab, page, perPage };

  const query = useFinancialEntriesQuery(params);
  const deleteMutation = useDeleteFinancialEntryMutation();
  const restoreMutation = useRestoreFinancialEntryMutation();

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
    tabCounts: { active: 0, deleted: 0 },
  };

  return {
    tab,
    setTab: (next: FinancialEntryListTab) => {
      setTabState(next);
      setPageState(1);
    },
    search,
    setSearch,
    filters,
    setFilters: (next: FinancialEntryListFilters) => {
      setFiltersState(next);
      setPageState(1);
    },
    sort,
    setSort: (next: FinancialEntrySortOption) => {
      setSortState(next);
      setPageState(1);
    },
    page,
    setPage: setPageState,
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      setPageState(1);
    },
    result,
    isLoading: query.isLoading,
    isError: query.isError,
    removeOne: (id: string) => deleteMutation.mutateAsync(id),
    isRemoving: deleteMutation.isPending,
    restoreOne: (id: string) => restoreMutation.mutateAsync(id),
    isRestoring: restoreMutation.isPending,
    refresh: () => {
      void query.refetch();
    },
  };
}

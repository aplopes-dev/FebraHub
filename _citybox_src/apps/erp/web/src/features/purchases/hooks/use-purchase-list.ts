"use client";

import { useEffect, useState } from "react";
import { createEmptyPurchaseFilters } from "@/features/purchases/lib/purchase-filters";
import { usePurchasesQuery } from "@/features/purchases/hooks/use-purchase-queries";
import {
  useDeletePurchaseMutation,
  useRestorePurchaseMutation,
} from "@/features/purchases/hooks/use-purchase-mutations";
import type {
  PurchaseListFilters,
  PurchaseListTab,
  PurchaseStatusFilter,
} from "@/features/purchases/types/purchase";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_TAB_COUNTS = { active: 0, deleted: 0 } as const;

export function usePurchaseList() {
  const [tab, setTabState] = useState<PurchaseListTab>("active");
  const [status, setStatusState] = useState<PurchaseStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<PurchaseListFilters>(
    createEmptyPurchaseFilters,
  );
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const deleteMutation = useDeletePurchaseMutation();
  const restoreMutation = useRestorePurchaseMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
      setSelectedIds(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = usePurchasesQuery({
    tab,
    status,
    search: debouncedSearch,
    filters,
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

  function resetListState() {
    setPageState(1);
    setSelectedIds(new Set());
  }

  function setTab(next: PurchaseListTab) {
    setTabState(next);
    resetListState();
  }

  function setStatus(next: PurchaseStatusFilter) {
    setStatusState(next);
    resetListState();
  }

  function setFilters(next: PurchaseListFilters) {
    setFiltersState(next);
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

  const pageIds = result.data.map((purchase) => purchase.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...pageIds]);
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

  async function remove(id: string): Promise<boolean> {
    try {
      await deleteMutation.mutateAsync(id);
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return true;
    } catch {
      return false;
    }
  }

  async function restore(id: string): Promise<boolean> {
    try {
      await restoreMutation.mutateAsync(id);
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return true;
    } catch {
      return false;
    }
  }

  return {
    tab,
    setTab,
    status,
    setStatus,
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    remove,
    restore,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: query.refetch,
  };
}

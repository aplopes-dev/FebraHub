"use client";

import { useEffect, useMemo } from "react";
import { useBranchListStore } from "@/features/branches/store/branch-list.store";
import { useOrganizationStructureQuery } from "@/features/branches/hooks/use-branch-queries";
import {
  useDeleteBranchMutation,
  useDeleteMatrixMutation,
} from "@/features/branches/hooks/use-branch-mutations";
import { filterOrganizationStructure } from "@/features/branches/lib/flatten-organization-structure";
import type { OrganizationStructure } from "@/features/branches/types/branch";

const SEARCH_DEBOUNCE_MS = 400;

export function useOrganizationUnitsList() {
  const search = useBranchListStore((state) => state.search);
  const debouncedSearch = useBranchListStore((state) => state.debouncedSearch);
  const setSearch = useBranchListStore((state) => state.setSearch);
  const commitSearch = useBranchListStore((state) => state.commitSearch);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const query = useOrganizationStructureQuery();
  const deleteMatrix = useDeleteMatrixMutation();
  const deleteStore = useDeleteBranchMutation();

  const structure = useMemo((): OrganizationStructure | null => {
    if (!query.data) return null;
    return filterOrganizationStructure(query.data, debouncedSearch);
  }, [query.data, debouncedSearch]);

  const matrixCount = structure?.matrices.length ?? 0;
  const storeCount = useMemo(() => {
    if (!structure) return 0;
    return Object.values(structure.storesByMatrix).reduce(
      (total, stores) => total + stores.length,
      0,
    );
  }, [structure]);

  return {
    search,
    setSearch,
    structure,
    matrixCount,
    storeCount,
    isSearchActive: debouncedSearch.trim().length > 0,
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    onDeleteMatrix: (id: string) => deleteMatrix.mutateAsync(id),
    onDeleteStore: (id: string) => deleteStore.mutateAsync(id),
  };
}

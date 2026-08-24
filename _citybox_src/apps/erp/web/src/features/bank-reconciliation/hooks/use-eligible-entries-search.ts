"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchEligibleEntriesApi } from "@/features/bank-reconciliation/api/bank-reconciliation.service";
import type { EligibleEntrySearchFilters } from "@/features/bank-reconciliation/types/bank-statement";

const SEARCH_DEBOUNCE_MS = 400;
const EMPTY_FILTERS: EligibleEntrySearchFilters = {};

/**
 * Busca manual/soma unificada (US3/US4, FR-016/017/036/037/038, research.md
 * D17) — substitui `use-financial-entry-search.ts`. Debounce 400ms só na
 * descrição (`search`); os demais filtros aplicam imediatamente.
 */
export function useEligibleEntriesSearch(
  bankStatementId: string,
  transactionId: string,
  enabled: boolean,
) {
  const [filters, setFilters] = useState<EligibleEntrySearchFilters>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search ?? ""), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [filters.search]);

  const debouncedFilters: EligibleEntrySearchFilters = {
    ...filters,
    search: debouncedSearch,
  };

  const query = useQuery({
    queryKey: [
      "bank-reconciliation",
      "eligible-entries",
      bankStatementId,
      transactionId,
      debouncedFilters,
    ],
    queryFn: () => searchEligibleEntriesApi(bankStatementId, transactionId, debouncedFilters),
    enabled: enabled && Boolean(bankStatementId) && Boolean(transactionId),
  });

  return {
    filters,
    setFilters,
    results: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

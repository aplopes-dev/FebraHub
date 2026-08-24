"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listFinancialStatementApi } from "@/features/financial-statement/api/financial-statement.service";
import { financialStatementKeys } from "@/features/financial-statement/hooks/query-keys";
import { createEmptyFinancialStatementFilters } from "@/features/financial-statement/lib/financial-statement-filters";
import type { FinancialStatementFilters } from "@/features/financial-statement/types/financial-statement";

const DEFAULT_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Estado de filtro/busca/paginação do extrato — molde de
 * `use-financial-entry-list.ts`, sem `tab`/`sort` (o extrato não expõe
 * nenhum dos dois).
 */
export function useFinancialStatementList() {
  const { scope, ready } = useCatalogScope();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<FinancialStatementFilters>(
    createEmptyFinancialStatementFilters,
  );
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = { search: debouncedSearch, filters, page, perPage };

  const query = useQuery({
    queryKey: financialStatementKeys.list(scope, params),
    queryFn: () => listFinancialStatementApi(params),
    enabled: ready,
  });

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
    tabCounts: { active: 0, deleted: 0 },
  };

  return {
    search,
    setSearch,
    filters,
    setFilters: (next: FinancialStatementFilters) => {
      setFiltersState(next);
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
    refresh: () => {
      void query.refetch();
    },
    // Repassados para `use-financial-statement-summary` — mesmo conjunto
    // filtrado (FR-008) — e para o efeito de reset de seleção (FR-011).
    summaryParams: { search: debouncedSearch, filters },
  };
}

"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import { listIssuedFiscalDocumentsApi } from "@/features/facilita-nfe/api/facilita-nfe.service";
import { facilitaNfeKeys } from "@/features/facilita-nfe/hooks/query-keys";
import {
  createEmptyFacilitaNfeIssuedFilters,
  type FacilitaNfeIssuedFilters,
} from "@/features/facilita-nfe/types/fiscal-document";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Estado da aba "Emitido" — molde `use-bank-account-list.ts`. Busca, filtro e
 * paginação vão para a `fiscal-api` (Constitution Princípio II) — a tabela só
 * mostra a página corrente, sem filtrar nada no cliente.
 */
export function useFacilitaNfeList() {
  const { scope } = useCatalogScope();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFiltersState] = useState<FacilitaNfeIssuedFilters>(
    createEmptyFacilitaNfeIssuedFilters,
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

  const params = {
    search: debouncedSearch,
    filters,
    page,
    perPage,
  };

  const query = useQuery({
    queryKey: facilitaNfeKeys.list(scope, params),
    queryFn: () => listIssuedFiscalDocumentsApi(params),
    // Sem `enabled`: o Emitente é resolvido no servidor a partir do tenant, então
    // não há id a esperar no cliente antes de consultar.
    retry: false,
  });

  // 404 da API = organização sem cadastro fiscal. É estado de negócio, não
  // falha: a tela mostra "Emitente fiscal não configurado" em vez de erro.
  const isCompanyMissing =
    query.error instanceof ApiError && query.error.status === 404;

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
  };

  return {
    search,
    setSearch,
    filters,
    setFilters: (next: FacilitaNfeIssuedFilters) => {
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
    isError: query.isError && !isCompanyMissing,
    isCompanyMissing,
    refresh: () => {
      void query.refetch();
    },
    // Repassado para `use-facilita-nfe-summary` — mesmo conjunto filtrado
    // (FR-003), sem paginação.
    summaryParams: { search: debouncedSearch, filters },
  };
}

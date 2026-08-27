"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listBankAccountsApi } from "@/features/bank-accounts/api/bank-accounts.service";
import { useCatalogScope } from "@/lib/organization-context";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export const bankAccountKeys = {
  all: (scope: string) => ["api", "bank-accounts", scope] as const,
};

/**
 * Estado da listagem de contas bancárias.
 *
 * Busca, página e tamanho vão para a API (política §8.1 do `AGENTS.md` raiz) —
 * a tabela mostra só a página corrente. O debounce evita uma requisição por
 * tecla digitada.
 */
export function useBankAccountList() {
  const { scope, ready } = useCatalogScope();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: [...bankAccountKeys.all(scope), debouncedSearch, page, perPage],
    queryFn: () =>
      listBankAccountsApi({ search: debouncedSearch, page, perPage }),
    enabled: ready,
  });

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
  };

  return {
    search,
    setSearch,
    page,
    setPage: setPageState,
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      setPageState(1);
    },
    result,
    isLoading: query.isLoading,
    invalidate: () => {
      void queryClient.invalidateQueries({
        queryKey: bankAccountKeys.all(scope),
      });
    },
  };
}

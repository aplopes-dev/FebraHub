"use client";

import { useEffect, useState } from "react";
import { useStatementTransactionsQuery } from "@/features/bank-reconciliation/hooks/use-bank-statement-queries";
import type { BankStatementTransactionStatus } from "@/features/bank-reconciliation/types/bank-statement";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * `status` muda só quando o operador troca de aba — o componente que chama
 * este hook deve remontar com `key={status}` (React docs: "resetting state
 * when a prop changes"), o que já zera `page`/`search` de propósito, sem
 * precisar de um efeito para isso.
 */
export function useBankStatementTransactionList(
  bankStatementId: string,
  status: BankStatementTransactionStatus,
) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  /** Filtro de período sobre `postedAt` (FR-035, research.md D15) — rótulo
   *  na UI é "Período", nunca "vencimento". */
  const [postedFrom, setPostedFromState] = useState<string | undefined>(undefined);
  const [postedTo, setPostedToState] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = {
    status,
    search: debouncedSearch,
    postedFrom,
    postedTo,
    page,
    perPage,
  };
  const query = useStatementTransactionsQuery(bankStatementId, params);

  const result = query.data ?? { data: [], meta: { total: 0, page, perPage } };

  return {
    search,
    setSearch,
    postedFrom,
    postedTo,
    setPeriod: (nextFrom: string | undefined, nextTo: string | undefined) => {
      setPostedFromState(nextFrom);
      setPostedToState(nextTo);
      setPageState(1);
    },
    page,
    setPage: setPageState,
    perPage,
    setPerPage: (next: number) => {
      setPerPage(next);
      setPageState(1);
    },
    result,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: () => {
      void query.refetch();
    },
  };
}

"use client";

import { useState } from "react";
import { useBankStatementsQuery } from "@/features/bank-reconciliation/hooks/use-bank-statement-queries";
import type { BankStatementStatus } from "@/features/bank-reconciliation/types/bank-statement";

const DEFAULT_PER_PAGE = 10;

export function useBankStatementList() {
  const [bankAccountId, setBankAccountIdState] = useState<string | undefined>(undefined);
  const [status, setStatusState] = useState<BankStatementStatus | undefined>(undefined);
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  const params = { bankAccountId, status, page, perPage };
  const query = useBankStatementsQuery(params);

  const result = query.data ?? { data: [], meta: { total: 0, page, perPage } };

  return {
    bankAccountId,
    setBankAccountId: (next: string | undefined) => {
      setBankAccountIdState(next);
      setPageState(1);
    },
    status,
    setStatus: (next: BankStatementStatus | undefined) => {
      setStatusState(next);
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
  };
}

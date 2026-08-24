"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  findBankStatementByIdApi,
  listBankStatementsApi,
  listStatementTransactionsApi,
  suggestMatchesApi,
} from "@/features/bank-reconciliation/api/bank-reconciliation.service";
import { bankStatementKeys } from "@/features/bank-reconciliation/hooks/query-keys";
import type {
  BankStatementListParams,
  BankStatementTransactionListParams,
} from "@/features/bank-reconciliation/types/bank-statement";

export function useBankStatementsQuery(params: BankStatementListParams) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: bankStatementKeys.list(scope, params),
    queryFn: () => listBankStatementsApi(params),
    enabled: ready,
  });
}

export function useBankStatementQuery(id: string) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: bankStatementKeys.detail(scope, id),
    queryFn: () => findBankStatementByIdApi(id),
    enabled: ready && Boolean(id),
  });
}

export function useStatementTransactionsQuery(
  bankStatementId: string,
  params: BankStatementTransactionListParams,
) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: bankStatementKeys.transactions(scope, bankStatementId, params),
    queryFn: () => listStatementTransactionsApi(bankStatementId, params),
    enabled: ready && Boolean(bankStatementId),
  });
}

export function useSuggestionsQuery(
  bankStatementId: string,
  transactionId: string,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: bankStatementKeys.suggestions(scope, bankStatementId, transactionId),
    queryFn: () => suggestMatchesApi(bankStatementId, transactionId),
    enabled: ready && enabled && Boolean(bankStatementId) && Boolean(transactionId),
  });
}

/** Sugestões de todas as transações pendentes de uma página — alimenta o
 *  painel consolidado "Registros sugeridos" (FR-041). Mesma `queryKey` de
 *  `useSuggestionsQuery`, então reaproveita o cache já populado pelos cartões
 *  individuais (sem requisição duplicada). */
export function useAllSuggestionsQueries(bankStatementId: string, transactionIds: string[]) {
  const { scope, ready } = useCatalogScope();
  return useQueries({
    queries: transactionIds.map((transactionId) => ({
      queryKey: bankStatementKeys.suggestions(scope, bankStatementId, transactionId),
      queryFn: () => suggestMatchesApi(bankStatementId, transactionId),
      enabled: ready && Boolean(bankStatementId) && Boolean(transactionId),
    })),
  });
}

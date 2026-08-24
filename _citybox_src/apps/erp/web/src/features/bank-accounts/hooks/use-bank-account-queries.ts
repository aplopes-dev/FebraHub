"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  findBankAccountByIdApi,
  listBankAccountStatementApi,
  listBankAccountTransactionsApi,
} from "@/features/bank-accounts/api/bank-accounts.service";
import { bankAccountKeys } from "@/features/bank-accounts/hooks/query-keys";
import type {
  BankAccountStatementParams,
  BankAccountTransactionsParams,
} from "@/features/bank-accounts/types/bank-account";

export function useBankAccountQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: bankAccountKeys.detail(scope, id),
    queryFn: () => findBankAccountByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

export function useBankAccountTransactionsQuery(
  id: string,
  params: BankAccountTransactionsParams,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: bankAccountKeys.transactions(scope, id, params),
    queryFn: () => listBankAccountTransactionsApi(id, params),
    enabled: ready && Boolean(id),
  });
}

export function useBankAccountStatementQuery(
  id: string,
  params: BankAccountStatementParams,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: bankAccountKeys.statement(scope, id, params),
    queryFn: () => listBankAccountStatementApi(id, params),
    enabled: ready && Boolean(id),
  });
}

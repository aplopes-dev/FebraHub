"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getChartOfAccountByIdApi,
  listChartOfAccounts,
} from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import { chartOfAccountKeys } from "@/features/chart-of-accounts/hooks/query-keys";
import type { ChartOfAccountListParams } from "@/features/chart-of-accounts/types/chart-of-account";

export function useChartOfAccountsQuery(params: ChartOfAccountListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: chartOfAccountKeys.list(scope, params),
    queryFn: () => listChartOfAccounts(params),
    enabled: ready,
  });
}

export function useChartOfAccountQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: chartOfAccountKeys.detail(scope, id),
    queryFn: () => getChartOfAccountByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

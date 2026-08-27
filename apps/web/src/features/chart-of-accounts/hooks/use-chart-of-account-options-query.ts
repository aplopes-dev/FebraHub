"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listChartOfAccountOptionsApi } from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import { chartOfAccountKeys } from "@/features/chart-of-accounts/hooks/query-keys";

export function useChartOfAccountOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: chartOfAccountKeys.options(scope),
    queryFn: listChartOfAccountOptionsApi,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
}

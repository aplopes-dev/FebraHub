"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getFinancialGroupByIdApi,
  listFinancialGroupOptions,
  listFinancialGroups,
} from "@/features/financial-groups/api/financial-groups.service";
import { financialGroupKeys } from "@/features/financial-groups/hooks/query-keys";
import type { FinancialGroupListParams } from "@/features/financial-groups/types/financial-group";

export function useFinancialGroupsQuery(params: FinancialGroupListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: financialGroupKeys.list(scope, params),
    queryFn: () => listFinancialGroups(params),
    enabled: ready,
  });
}

export function useFinancialGroupQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: financialGroupKeys.detail(scope, id),
    queryFn: () => getFinancialGroupByIdApi(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

export function useFinancialGroupOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: financialGroupKeys.options(scope),
    queryFn: () => listFinancialGroupOptions(),
    enabled: ready,
    staleTime: 5 * 60_000,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listCostCenterOptionsApi } from "@/features/cost-centers/api/cost-centers.service";
import { costCenterKeys } from "@/features/cost-centers/hooks/query-keys";

export function useCostCenterOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: costCenterKeys.options(scope),
    queryFn: listCostCenterOptionsApi,
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
}

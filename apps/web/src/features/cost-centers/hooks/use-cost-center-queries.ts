"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCostCenterById,
  listCostCenters,
} from "@/features/cost-centers/api/cost-centers.service";
import { costCenterKeys } from "@/features/cost-centers/hooks/query-keys";
import type { CostCenterListParams } from "@/features/cost-centers/types/cost-center";

export function useCostCentersQuery(params: CostCenterListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: costCenterKeys.list(scope, params),
    queryFn: () => listCostCenters(params),
    enabled: ready,
  });
}

export function useCostCenterQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: costCenterKeys.detail(scope, id),
    queryFn: () => getCostCenterById(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

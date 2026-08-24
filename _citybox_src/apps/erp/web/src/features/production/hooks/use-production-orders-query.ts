"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listProductionOrdersApi } from "@/features/production/api/production.service";
import { productionKeys } from "@/features/production/hooks/query-keys";
import type { ProductionOrderListParams } from "@/features/production/types/production";

export function useProductionOrdersQuery(params: ProductionOrderListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productionKeys.list(scope, params),
    queryFn: () => listProductionOrdersApi(params),
    enabled: ready,
  });
}

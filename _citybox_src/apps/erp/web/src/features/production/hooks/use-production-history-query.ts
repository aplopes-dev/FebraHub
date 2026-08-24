"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listProductionHistoryApi } from "@/features/production/api/production.service";
import { productionKeys } from "@/features/production/hooks/query-keys";

/** Timeline (mais recente primeiro) da ordem de produção. */
export function useProductionHistoryQuery(orderId: string | null) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productionKeys.history(scope, orderId ?? ""),
    queryFn: () => listProductionHistoryApi(orderId as string),
    enabled: ready && Boolean(orderId),
  });
}

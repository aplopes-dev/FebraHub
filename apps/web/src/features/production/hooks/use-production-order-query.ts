"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { getProductionOrderApi } from "@/features/production/api/production.service";
import { productionKeys } from "@/features/production/hooks/query-keys";

/** Detalhe da ordem — inclui os insumos calculados (BOM × quantidade). */
export function useProductionOrderQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: productionKeys.detail(scope, id ?? ""),
    queryFn: () => getProductionOrderApi(id as string),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

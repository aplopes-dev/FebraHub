"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  listAllVariations,
  listVariationsPaginated,
} from "@/features/variations/api/variations.service";
import { variationKeys } from "@/features/variations/hooks/query-keys";
import type { VariationListParams } from "@/features/variations/types/variation";

export function useVariationsQuery(params: VariationListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: variationKeys.list(scope, params),
    queryFn: () => listVariationsPaginated(params),
    enabled: ready,
  });
}

export function useAllVariationsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: variationKeys.catalog(scope),
    queryFn: listAllVariations,
    enabled: ready,
    staleTime: 60_000,
  });
}

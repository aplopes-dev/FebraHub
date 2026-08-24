"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  listActiveUnitsOfMeasure,
  listUnitsOfMeasurePaginated,
} from "@/features/unit-of-measure/api/units-of-measure.service";
import { unitOfMeasureKeys } from "@/features/unit-of-measure/hooks/query-keys";
import type { UnitOfMeasureListParams } from "@/features/unit-of-measure/types/unit-of-measure";

export function useUnitsOfMeasureQuery(params: UnitOfMeasureListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: unitOfMeasureKeys.list(scope, params),
    queryFn: () => listUnitsOfMeasurePaginated(params),
    enabled: ready,
  });
}

export function useActiveUnitsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: unitOfMeasureKeys.active(scope),
    queryFn: listActiveUnitsOfMeasure,
    enabled: ready,
    staleTime: 60_000,
  });
}

export function useDecimalPlacesByAbbreviation(abbreviation: string): number {
  const query = useActiveUnitsQuery();
  const unit = query.data?.find(
    (item) =>
      item.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase(),
  );
  return unit?.decimalPlaces ?? 0;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useVehicleModelsQuery } from "@/features/vehicle-models/hooks/use-vehicle-model-queries";
import { formatVehicleModelLabel } from "@/features/vehicle-models/lib/vehicle-model-format";
import type {
  VehicleModel,
  VehicleModelStatusFilter,
} from "@/features/vehicle-models/types/vehicle-model";

const SEARCH_DEBOUNCE_MS = 300;

export function useVehicleModelList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VehicleModelStatusFilter>("");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  const listParams = useMemo(
    () => ({
      status: statusFilter === "" ? undefined : statusFilter,
    }),
    [statusFilter],
  );

  const query = useVehicleModelsQuery(listParams);

  const filteredItems = useMemo(() => {
    const items = query.data ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = [
        item.brand,
        item.model,
        item.version ?? "",
        item.year != null ? String(item.year) : "",
        formatVehicleModelLabel(item),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query.data, debouncedSearch]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    items: filteredItems,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export type VehicleModelRow = VehicleModel & {
  label: string;
};

export function toVehicleModelRow(model: VehicleModel): VehicleModelRow {
  return {
    ...model,
    label: formatVehicleModelLabel(model),
  };
}

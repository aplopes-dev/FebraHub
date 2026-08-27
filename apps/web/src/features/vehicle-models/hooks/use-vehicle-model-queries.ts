"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import { listVehicleModels } from "@/features/vehicle-models/api/vehicle-models.service";
import { vehicleModelKeys } from "@/features/vehicle-models/hooks/query-keys";
import type { VehicleModelListParams } from "@/features/vehicle-models/types/vehicle-model";

export function useVehicleModelsQuery(params: VehicleModelListParams) {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: vehicleModelKeys.list(organizationId, params),
    queryFn: () => listVehicleModels(params),
    enabled: hydrated && Boolean(organizationId),
  });
}

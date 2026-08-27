import type { VehicleModelListParams } from "@/features/vehicle-models/types/vehicle-model";

export const vehicleModelKeys = {
  all: (organizationId: string) =>
    ["api", "vehicle-models", organizationId] as const,
  lists: (organizationId: string) =>
    [...vehicleModelKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: VehicleModelListParams) =>
    [...vehicleModelKeys.lists(organizationId), params] as const,
  detail: (organizationId: string, id: string) =>
    [...vehicleModelKeys.all(organizationId), "detail", id] as const,
};

import type { VehicleModel } from "@/features/vehicle-models/types/vehicle-model";

export function formatVehicleModelLabel(model: Pick<
  VehicleModel,
  "brand" | "model" | "version" | "year"
>): string {
  const parts = [model.brand, model.model];
  if (model.version) {
    parts.push(model.version);
  }
  if (model.year != null) {
    parts.push(String(model.year));
  }
  return parts.join(" · ");
}

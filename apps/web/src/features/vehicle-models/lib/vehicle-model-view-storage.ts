export type VehicleModelView = "grid" | "list";

export const VEHICLE_MODEL_VIEW_STORAGE_KEY = "app.vehicle-models-view";

const VALID_VIEWS = new Set<VehicleModelView>(["grid", "list"]);

export function readStoredVehicleModelView(
  fallback: VehicleModelView = "grid",
): VehicleModelView {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(VEHICLE_MODEL_VIEW_STORAGE_KEY);
    if (raw && VALID_VIEWS.has(raw as VehicleModelView)) {
      return raw as VehicleModelView;
    }
  } catch {
    // Quota / modo privado — ignora e usa o fallback.
  }
  return fallback;
}

export function writeStoredVehicleModelView(view: VehicleModelView): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VEHICLE_MODEL_VIEW_STORAGE_KEY, view);
  } catch {
    // Quota / modo privado — preferência só nesta sessão.
  }
}

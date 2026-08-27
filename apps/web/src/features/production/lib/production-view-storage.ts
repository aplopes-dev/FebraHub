export type ProductionView = "kanban" | "list";

export const PRODUCTION_VIEW_STORAGE_KEY = "app.production-view";

const VALID_VIEWS = new Set<ProductionView>(["kanban", "list"]);

export function readStoredProductionView(
  fallback: ProductionView = "kanban",
): ProductionView {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PRODUCTION_VIEW_STORAGE_KEY);
    if (raw && VALID_VIEWS.has(raw as ProductionView)) {
      return raw as ProductionView;
    }
  } catch {
    // Quota / modo privado — ignora e usa o fallback.
  }
  return fallback;
}

export function writeStoredProductionView(view: ProductionView): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRODUCTION_VIEW_STORAGE_KEY, view);
  } catch {
    // Quota / modo privado — preferência só nesta sessão.
  }
}

import { DEFAULT_BRAND_COLOR } from "@/theme/brand-color";

/**
 * Cor de marca persistida em `localStorage` e propagada por evento —
 * o mesmo canal que `AppProviders` escuta para repintar o tema e o favicon.
 */
export const BRAND_COLOR_STORAGE_KEY = "company_brand_color";
export const BRAND_COLOR_CHANGED_EVENT = "brand-color-changed";

/** Assina mudanças da cor salva (nesta aba e em outras). */
export function subscribeBrandColor(onStoreChange: () => void): () => void {
  window.addEventListener(BRAND_COLOR_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(BRAND_COLOR_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Snapshot no client. */
export function readStoredBrandColor(): string {
  return localStorage.getItem(BRAND_COLOR_STORAGE_KEY) ?? DEFAULT_BRAND_COLOR;
}

/** Snapshot no servidor — evita divergência de hidratação. */
export function readDefaultBrandColor(): string {
  return DEFAULT_BRAND_COLOR;
}

export function persistBrandColor(brandColor: string): void {
  localStorage.setItem(BRAND_COLOR_STORAGE_KEY, brandColor);
  window.dispatchEvent(
    new CustomEvent(BRAND_COLOR_CHANGED_EVENT, { detail: brandColor }),
  );
}

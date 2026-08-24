export type ComercioStoreSegment = "food" | "varejo";

export type ComercioStore = {
  id: string;
  name: string;
  segment: ComercioStoreSegment;
  /** Cor primária do tema da loja (hex). */
  primaryColor: string;
  /** Texto/ícone sobre a primária (hex). */
  primaryForeground: string;
};

export const MOCK_STORES: ComercioStore[] = [
  {
    id: "boteco-do-cais",
    name: "Boteco do Cais",
    segment: "food",
    primaryColor: "#E85D04",
    primaryForeground: "#FFFFFF",
  },
  {
    id: "moda-ilheus",
    name: "Moda Ilhéus",
    segment: "varejo",
    primaryColor: "#2563EB",
    primaryForeground: "#FFFFFF",
  },
  {
    id: "emporio-casa-cozinha",
    name: "Empório Casa & Cozinha",
    segment: "varejo",
    primaryColor: "#0D9488",
    primaryForeground: "#FFFFFF",
  },
];

export const ACTIVE_STORE_STORAGE_KEY = "citybox-comercio-active-store";

export function getDefaultStoreId(): string {
  return MOCK_STORES[0]?.id ?? "";
}

export function findStoreById(id: string): ComercioStore | undefined {
  return MOCK_STORES.find((store) => store.id === id);
}

export function readStoredStoreId(): string {
  if (typeof window === "undefined") return getDefaultStoreId();
  try {
    const stored = window.localStorage.getItem(ACTIVE_STORE_STORAGE_KEY);
    if (stored && findStoreById(stored)) return stored;
  } catch {
    // ignore storage errors
  }
  return getDefaultStoreId();
}

export function writeStoredStoreId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, id);
  } catch {
    // ignore storage errors
  }
}

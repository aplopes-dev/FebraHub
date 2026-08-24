"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePermissions } from "./permissions-context";
import { useSession } from "./session-context";
import { fetchMyStores, StoresApiError } from "./stores-api";
import { filterAccessibleStores, type StoreOption } from "./store-routing";
import {
  DEFAULT_CLINIC_STRAND,
  type ClinicStrand,
} from "@citybox/messaging/clinic-strand";

const STORE_KEY = "citybox-active-store";

type StoredStore = { id: string; name: string; vertical: string };

export type StoresLoadError = 'unavailable' | 'unauthorized';

type StoreContextValue = {
  storeId: string;
  storeName: string;
  storeVertical: string;
  clinicStrand: ClinicStrand;
  /** Member.id do usuário na clínica ativa (professionalId da agenda). */
  memberId: string | undefined;
  stores: StoreOption[];
  accessibleStores: StoreOption[];
  storesLoadError: StoresLoadError | null;
  setStore: (id: string, name: string, vertical: string) => void;
  patchStore: (id: string, patch: Partial<Pick<StoreOption, "name">>) => void;
  version: number;
  loading: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readSavedStore(): StoredStore | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredStore & { vertical?: string };
    if (!parsed?.id || !parsed?.name) return null;
    if (!parsed.vertical) return null;
    return { id: parsed.id, name: parsed.name, vertical: parsed.vertical };
  } catch {
    return null;
  }
}

function persistStore(id: string, name: string, vertical: string) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ id, name, vertical }));
}

type StoreSetters = {
  setStoreId: (id: string) => void;
  setStoreName: (name: string) => void;
  setStoreVertical: (vertical: string) => void;
};

function applyStoreSelection(store: StoreOption, setters: StoreSetters) {
  setters.setStoreId(store.id);
  setters.setStoreName(store.name);
  setters.setStoreVertical(store.vertical);
  persistStore(store.id, store.name, store.vertical);
}

/**
 * Seleciona a loja ativa a partir das lojas acessíveis.
 * - 1 loja → entra direto.
 * - Loja salva no navegador e ainda acessível → mantém a escolha do usuário.
 * - Várias lojas sem correspondência (sem loja salva ou loja salva sem acesso) →
 *   NÃO auto-seleciona. Deixa a seleção vazia para que o usuário escolha em
 *   /selecionar-loja, evitando trocar de vertical à revelia do usuário.
 */
function selectFromAccessible(
  accessible: StoreOption[],
  setters: StoreSetters,
) {
  if (accessible.length === 0) return;

  if (accessible.length === 1) {
    applyStoreSelection(accessible[0], setters);
    return;
  }

  const saved = readSavedStore();
  const match = saved ? accessible.find((s) => s.id === saved.id) : undefined;
  if (match) {
    applyStoreSelection(match, setters);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeVertical, setStoreVertical] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [accessibleStores, setAccessibleStores] = useState<StoreOption[]>([]);
  const [storesLoadError, setStoresLoadError] = useState<StoresLoadError | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const storeSetters: StoreSetters = {
      setStoreId,
      setStoreName,
      setStoreVertical,
    };

    const loadStores = async () => {
      if (cancelled) return;
      if (status === "loading" || permissionsLoading) return;

      if (status !== "authenticated") {
        setStores([]);
        setAccessibleStores([]);
        setStoresLoadError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setStoresLoadError(null);

      try {
        const myStores = await fetchMyStores();
        if (cancelled) return;
        setStores(myStores);
        const accessible = filterAccessibleStores(myStores, permissions);
        setAccessibleStores(accessible);
        selectFromAccessible(accessible, storeSetters);
      } catch (err) {
        if (!cancelled) {
          setStores([]);
          setAccessibleStores([]);
          if (err instanceof StoresApiError && err.status === 401) {
            setStoresLoadError("unauthorized");
          } else {
            setStoresLoadError("unavailable");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStores();
    return () => {
      cancelled = true;
    };
  }, [permissions, permissionsLoading, status]);

  const setStore = useCallback((id: string, name: string, vertical: string) => {
    setStoreId(id);
    setStoreName(name);
    setStoreVertical(vertical);
    persistStore(id, name, vertical);
    setVersion((v) => v + 1);
  }, []);

  const patchStore = useCallback(
    (id: string, patch: Partial<Pick<StoreOption, "name">>) => {
      const name = patch.name?.trim();
      if (!name) return;

      const updateList = (prev: StoreOption[]) => {
        if (!prev.some((s) => s.id === id && s.name !== name)) return prev;
        return prev.map((s) => (s.id === id ? { ...s, name } : s));
      };

      setStores(updateList);
      setAccessibleStores(updateList);

      if (id !== storeId || storeName === name) return;

      setStoreName(name);
      persistStore(id, name, storeVertical);
      setVersion((v) => v + 1);
    },
    [storeId, storeName, storeVertical],
  );

  const activeStore = accessibleStores.find((store) => store.id === storeId);
  const clinicStrand = activeStore?.clinicStrand ?? DEFAULT_CLINIC_STRAND;

  return (
    <StoreContext.Provider
      value={{
        storeId,
        storeName,
        storeVertical,
        clinicStrand,
        memberId: activeStore?.memberId,
        stores,
        accessibleStores,
        storesLoadError,
        setStore,
        patchStore,
        version,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

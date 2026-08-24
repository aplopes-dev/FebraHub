'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from './session-context';
import { fetchMyStores, StoresApiError, type StoreOption } from './stores-api';
import { hasVerticalViewPermission } from './vertical-permissions';
import {
  persistActiveStore,
  readSavedActiveStore,
} from './active-store-storage';

export { clearActiveStoreStorage } from './active-store-storage';

export type StoresLoadError = 'unavailable' | 'unauthorized';

type StoreContextValue = {
  storeId: string;
  storeName: string;
  memberId: string | undefined;
  stores: StoreOption[];
  storesLoadError: StoresLoadError | null;
  setStore: (id: string, name: string) => void;
  version: number;
  loading: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function persistStore(id: string, name: string) {
  persistActiveStore(id, name);
}

/**
 * Seleção de loja ativa:
 * - 1 loja → auto
 * - N → salva no localStorage ou primeira; troca via `UnitSwitcher` no header
 * - 0 → shell bloqueia
 */
function selectFromStores(
  stores: StoreOption[],
  setStoreId: (id: string) => void,
  setStoreName: (name: string) => void,
) {
  if (stores.length === 0) return;

  if (stores.length === 1) {
    const only = stores[0];
    setStoreId(only.id);
    setStoreName(only.name);
    persistStore(only.id, only.name);
    return;
  }

  const saved = readSavedActiveStore();
  const match = saved ? stores.find((s) => s.id === saved.id) : undefined;
  const chosen = match ?? stores[0];
  setStoreId(chosen.id);
  setStoreName(chosen.name);
  persistStore(chosen.id, chosen.name);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { status, session } = useSession();
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storesLoadError, setStoresLoadError] = useState<StoresLoadError | null>(
    null,
  );
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      if (cancelled) return;

      if (status === 'loading') return;

      if (status !== 'authenticated') {
        setStores([]);
        setStoresLoadError(null);
        setStoreId('');
        setStoreName('');
        setLoading(false);
        return;
      }

      const permissions = session?.permissions ?? [];
      if (!hasVerticalViewPermission(permissions)) {
        setStores([]);
        setStoresLoadError('unauthorized');
        setLoading(false);
        return;
      }

      setLoading(true);
      setStoresLoadError(null);

      try {
        const myStores = await fetchMyStores();
        if (cancelled) return;
        setStores(myStores);
        selectFromStores(myStores, setStoreId, setStoreName);
      } catch (err) {
        if (!cancelled) {
          setStores([]);
          setStoreId('');
          setStoreName('');
          if (err instanceof StoresApiError && err.status === 401) {
            setStoresLoadError('unauthorized');
          } else {
            setStoresLoadError('unavailable');
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
  }, [session?.permissions, status]);

  const setStore = useCallback((id: string, name: string) => {
    setStoreId(id);
    setStoreName(name);
    persistStore(id, name);
    setVersion((v) => v + 1);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        storeId,
        storeName,
        memberId: stores.find((s) => s.id === storeId)?.memberId,
        stores,
        storesLoadError,
        setStore,
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
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

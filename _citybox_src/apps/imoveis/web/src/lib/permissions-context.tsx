'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchPlatformPermissions,
  hasPermissionSync,
  invalidatePermissionsCache,
} from './permissions';
import { sessionsEqual } from './session-utils';
import { useAuthSession } from './session-context';

type PermissionsContextValue = {
  permissions: string[];
  loading: boolean;
  hasPermission: (permission?: string) => boolean;
  refresh: () => Promise<string[]>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuthSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const prevSessionRef = useRef(session);

  const refresh = useCallback(async (): Promise<string[]> => {
    if (status !== 'authenticated' || !session?.user?.name) {
      setPermissions([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const perms = await fetchPlatformPermissions(session);
      setPermissions(perms);
      return perms;
    } catch {
      const fallback = session.permissions ?? [];
      setPermissions(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'anonymous' || !session) {
      invalidatePermissionsCache();
      setPermissions([]);
      setLoading(false);
      prevSessionRef.current = session;
      return;
    }

    if (sessionsEqual(prevSessionRef.current, session)) return;
    invalidatePermissionsCache();
    prevSessionRef.current = session;
    void refresh();
  }, [refresh, session, status]);

  const hasPermission = useCallback(
    (permission?: string) => hasPermissionSync(permissions, permission),
    [permissions],
  );

  return (
    <PermissionsContext.Provider
      value={{ permissions, loading, hasPermission, refresh }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions deve ser usado dentro de PermissionsProvider');
  }
  return ctx;
}

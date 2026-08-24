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
import { performSsoLogout, setMemorySession, type AuthSession } from './auth';
import { registerSessionBridge } from './session-bridge';
import { sessionToStatus, sessionsEqual } from './session-utils';
import { hasBackofficeAccess } from './vertical-permissions';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthSessionContextValue = {
  status: AuthSessionStatus;
  session: AuthSession | null;
  loggingOut: boolean;
  refresh: () => Promise<AuthSession | null>;
  patchUser: (user: Partial<AuthSession['user']>) => void;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const SYNC_INTERVAL_MS = 120_000;
const SYNC_JITTER_MS = 30_000;

async function fetchServerSession(): Promise<AuthSession | null> {
  try {
    const res = await fetch('/api/auth/session', { method: 'GET', credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthSession;
    if (!hasBackofficeAccess(data.permissions ?? [])) return null;
    return data;
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthSessionStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const syncInFlight = useRef<Promise<AuthSession | null> | null>(null);
  const loggingOutRef = useRef(false);

  const refresh = useCallback(async (): Promise<AuthSession | null> => {
    if (loggingOutRef.current) return null;
    if (syncInFlight.current) return syncInFlight.current;

    syncInFlight.current = (async () => {
      const next = await fetchServerSession();
      setMemorySession(next);

      setSession((prev) => (sessionsEqual(prev, next) ? prev : next));
      setStatus((prev) => {
        if (prev === 'loading') return sessionToStatus(next);
        const nextStatus = sessionToStatus(next);
        return prev === nextStatus ? prev : nextStatus;
      });

      return next;
    })().finally(() => {
      syncInFlight.current = null;
    });

    return syncInFlight.current;
  }, []);

  const patchUser = useCallback((user: Partial<AuthSession['user']>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: AuthSession = {
        ...prev,
        user: { ...prev.user, ...user },
      };
      setMemorySession(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    setMemorySession(null);
    await performSsoLogout();
  }, []);

  useEffect(() => {
    registerSessionBridge({ refresh, patchUser });
    return () => registerSessionBridge(null);
  }, [patchUser, refresh]);

  useEffect(() => {
    void refresh();
    const delay = SYNC_INTERVAL_MS + Math.floor(Math.random() * SYNC_JITTER_MS);
    const timer = setInterval(() => void refresh(), delay);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <AuthSessionContext.Provider
      value={{ status, session, loggingOut, refresh, patchUser, logout }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuthSession deve ser usado dentro de AuthSessionProvider');
  return ctx;
}

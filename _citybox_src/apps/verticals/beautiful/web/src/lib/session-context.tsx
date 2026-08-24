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
import { performSsoLogout, setMemorySession, type Session } from './auth';
import { registerSessionBridge } from './session-bridge';
import { sessionToStatus, sessionsEqual } from './session-utils';
import { clearActiveStoreStorage } from './active-store-storage';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  loggingOut: boolean;
  refresh: () => Promise<Session | null>;
  patchUser: (user: Partial<Session['user']>) => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const SYNC_INTERVAL_MS = 120_000;
const SYNC_JITTER_MS = 30_000;

async function fetchServerSession(): Promise<Session | null> {
  try {
    const res = await fetch('/api/auth/session', { method: 'GET', credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const syncInFlight = useRef<Promise<Session | null> | null>(null);
  const loggingOutRef = useRef(false);

  const refresh = useCallback(async (): Promise<Session | null> => {
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

  const patchUser = useCallback((user: Partial<Session['user']>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: Session = {
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
    clearActiveStoreStorage();
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
    <SessionContext.Provider value={{ status, session, loggingOut, refresh, patchUser, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve ser usado dentro de SessionProvider');
  return ctx;
}

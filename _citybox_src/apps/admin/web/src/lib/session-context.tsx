'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { performSsoLogout, setMemorySession, type Session } from './auth';
import { hasPlatformAdminAccess } from './platform-access';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  refresh: () => Promise<Session | null>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_FETCH_TIMEOUT_MS = 10_000;
const SESSION_RENEWAL_INTERVAL_MS = 120_000;
const SESSION_RENEWAL_JITTER_MS = 30_000;

async function fetchServerSession(): Promise<Session | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('/api/auth/session', {
      credentials: 'include',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Session;
    if (!hasPlatformAdminAccess(data.permissions ?? [])) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchServerSession();
    setMemorySession(next);
    setSession(next);
    setStatus(next ? 'authenticated' : 'anonymous');
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const jitter = Math.random() * SESSION_RENEWAL_JITTER_MS;
    const id = setInterval(() => void refresh(), SESSION_RENEWAL_INTERVAL_MS + jitter);
    return () => clearInterval(id);
  }, [status, refresh]);

  const logout = useCallback(async () => {
    await performSsoLogout();
  }, []);

  return (
    <SessionContext.Provider value={{ status, session, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession fora de SessionProvider');
  return ctx;
}

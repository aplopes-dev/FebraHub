'use client';

import { getMemorySession, setMemorySession, type Session } from './auth';
import { getSessionBridge } from './session-bridge';

/** Sincroniza sessão com o BFF — delega ao SessionProvider quando o bridge está registrado. */
export async function refreshAuthSession(): Promise<Session | null> {
  const registered = getSessionBridge();
  if (registered) return registered.refresh();

  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return getMemorySession();
    const data = (await res.json()) as Session;
    setMemorySession(data);
    return data;
  } catch {
    return getMemorySession();
  }
}

/** Fetch com credentials; em 401 tenta sincronizar sessão uma vez. */
export async function fetchWithSession(input: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: 'include',
      headers: init.headers,
    });

  const first = await doFetch();
  if (first.status !== 401) return first;

  await refreshAuthSession();
  return doFetch();
}

export async function isServerSessionDead(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', { method: 'GET', credentials: 'include' });
    return res.status === 401;
  } catch {
    return false;
  }
}

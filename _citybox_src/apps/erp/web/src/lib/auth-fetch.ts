'use client';

import { getMemorySession, setMemorySession, type Session } from './auth';
import { getSessionBridge } from './session-bridge';

/** Sincroniza a sessão com o BFF — delega ao provider quando ele está montado. */
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

/**
 * `fetch` com cookie de sessão e uma retentativa em 401.
 *
 * O 401 costuma ser access token vencido entre a renderização e o clique: o
 * refresh acontece server-side e a segunda tentativa passa, sem o usuário ver
 * erro nenhum.
 */
export async function fetchWithSession(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const doFetch = () =>
    fetch(input, { ...init, credentials: 'include', headers: init.headers });

  const first = await doFetch();
  if (first.status !== 401) return first;

  await refreshAuthSession();
  return doFetch();
}

export async function isServerSessionDead(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    return res.status === 401;
  } catch {
    return false;
  }
}

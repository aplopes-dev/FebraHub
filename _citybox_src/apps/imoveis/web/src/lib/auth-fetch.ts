'use client';

import { getMemorySession, setMemorySession, type AuthSession } from './auth';
import { getSessionBridge } from './session-bridge';
import { hasBackofficeAccess } from './vertical-permissions';

export async function refreshAuthSession(): Promise<AuthSession | null> {
  const registered = getSessionBridge();
  if (registered) return registered.refresh();

  try {
    const res = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return getMemorySession();
    const data = (await res.json()) as AuthSession;
    if (!hasBackofficeAccess(data.permissions ?? [])) return getMemorySession();
    setMemorySession(data);
    return data;
  } catch {
    return getMemorySession();
  }
}

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

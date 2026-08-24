'use client';

import { hasBackofficeAccess } from './vertical-permissions';
import { beginOAuthAuthorization, clearOAuthPending } from './oauth-pkce';

/** Metadados públicos — JWTs ficam em cookies httpOnly (BFF). */
export type AuthSession = {
  user: { name: string; email?: string; username?: string };
  expiresAt: number;
  permissions?: string[];
};

let memorySession: AuthSession | null = null;

export function getMemorySession(): AuthSession | null {
  return memorySession;
}

export function setMemorySession(session: AuthSession | null) {
  memorySession = session;
}

export function getLoginUrl(redirectUri: string, force = false): Promise<string> {
  return beginOAuthAuthorization(redirectUri, force);
}

export async function performSsoLogout() {
  if (typeof window === 'undefined') return;
  memorySession = null;
  clearOAuthPending();

  try {
    const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    const data = (await res.json()) as { logoutUrl?: string };
    window.location.replace(data.logoutUrl ?? '/login?loggedOut=1');
  } catch {
    window.location.replace('/login?loggedOut=1');
  }
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<AuthSession> {
  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, redirectUri, codeVerifier }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`token_exchange_${res.status}:${text.slice(0, 300)}`);
  }
  const data = JSON.parse(text) as AuthSession;
  if (!hasBackofficeAccess(data.permissions ?? [])) {
    throw new Error(`no_backoffice_access:${JSON.stringify(data.permissions ?? [])}`);
  }
  memorySession = data;
  return data;
}

export function sessionHasBackofficeAccess(session: AuthSession | null): boolean {
  if (!session) return false;
  return hasBackofficeAccess(session.permissions ?? []);
}

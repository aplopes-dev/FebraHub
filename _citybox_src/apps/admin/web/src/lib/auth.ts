'use client';

import { beginOAuthAuthorization } from './oauth-pkce';

export type Session = {
  user: { name: string; email?: string };
  expiresAt: number;
  permissions?: string[];
};

let memorySession: Session | null = null;

export function getMemorySession(): Session | null {
  return memorySession;
}

export function setMemorySession(session: Session | null) {
  memorySession = session;
}

export function getLoginUrl(redirectUri: string, force = false): Promise<string> {
  return beginOAuthAuthorization(redirectUri, force);
}

function isSafeLogoutUrl(url: string): boolean {
  if (url.startsWith('/login')) return true;
  try {
    const parsed = new URL(url);
    const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
    if (issuer) {
      const issuerOrigin = new URL(issuer).origin;
      if (
        parsed.origin === issuerOrigin &&
        parsed.pathname.endsWith('/protocol/openid-connect/logout')
      ) {
        return true;
      }
    }
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin && parsed.pathname === '/login') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Encerra sessão local e redireciona ao logout SSO do Keycloak. */
export async function performSsoLogout() {
  if (typeof window === 'undefined') return;
  memorySession = null;
  const localLogin = `${window.location.origin}/login?loggedOut=1`;
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error(`logout_${res.status}`);
    const data = (await res.json()) as { logoutUrl?: string };
    const logoutUrl = data.logoutUrl?.trim();
    if (logoutUrl && isSafeLogoutUrl(logoutUrl)) {
      window.location.href = logoutUrl;
      return;
    }
    window.location.href = localLogin;
  } catch {
    window.location.href = localLogin;
  }
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<Session> {
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
  const data = JSON.parse(text) as Session;
  memorySession = data;
  return data;
}


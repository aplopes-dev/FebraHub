'use client';

/** Browser-only — não importar em Server Components ou middleware. */
import { beginOAuthAuthorization, clearOAuthPending } from './oauth-pkce';

/** Metadados públicos — JWTs ficam em cookies httpOnly (BFF). Fonte canônica: `useSession()`. */
export type Session = {
  user: { name: string; email?: string; username?: string };
  expiresAt: number;
  permissions?: string[];
};

/** Espelho interno sincronizado pelo SessionProvider — não usar fora de auth/session-bridge. */
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

/** Encerra sessão local e redireciona ao logout SSO do Keycloak. */
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

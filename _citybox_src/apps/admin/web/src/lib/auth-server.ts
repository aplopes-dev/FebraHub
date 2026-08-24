import type { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  ID_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
} from './auth-cookie';
import { hasPlatformAdminAccess } from './platform-access';

const ACCESS_SKEW_MS = 60_000;
const KEYCLOAK_FETCH_TIMEOUT_MS = 8_000;

/**
 * Issuer ÚNICO do realm `citybox-admin` (ADR C-16/C-17). Sem default: um app mal
 * configurado tem de falhar, não cair silenciosamente em outro realm.
 */
export function keycloakIssuer(): string {
  const issuer =
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER?.trim() || process.env.KEYCLOAK_ISSUER?.trim();
  if (!issuer) throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');
  return issuer;
}

export function keycloakServerIssuer(): string {
  return keycloakIssuer();
}

/** Client `admin-web`. Sem default — ver ADR C-17, bloco 6. */
export function keycloakClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT?.trim();
  if (!clientId) throw new Error('NEXT_PUBLIC_KEYCLOAK_CLIENT não configurado');
  return clientId;
}

export function keycloakClientSecret(): string {
  const secret = process.env.KEYCLOAK_ADMIN_WEB_SECRET?.trim();
  if (!secret) throw new Error('KEYCLOAK_ADMIN_WEB_SECRET não configurado');
  return secret;
}

function allowedRedirectOrigins(): Set<string> {
  // Lista explícita, espelhando as `redirectUris` de `admin-web` em
  // `infra/keycloak/import/citybox-admin-realm.json` (invariante 3 do ADR C-16:
  // nenhuma redirect URI com wildcard de host ou porta).
  const origins = new Set([
    'https://admin.citybox.com',
    'https://admin.aplopes.com',
    'http://localhost:3108',
    'http://127.0.0.1:3108',
  ]);
  const extra = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.trim();
  if (extra) {
    try {
      origins.add(new URL(extra).origin);
    } catch {
      // ignora
    }
  }
  return origins;
}

/** Origem do admin-web para redirects OAuth/logout (respeita Origin do browser em dev). */
export function adminWebOrigin(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // ignora
    }
  }
  const origin = requestOrigin?.trim();
  if (origin && allowedRedirectOrigins().has(origin)) {
    return origin;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://admin.citybox.com';
  }
  return 'http://127.0.0.1:3108';
}

export function isAllowedRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    if (url.pathname !== '/auth/callback') return false;
    if (url.protocol === 'http:') {
      return ['localhost', '127.0.0.1'].includes(url.hostname);
    }
    if (url.protocol === 'https:') {
      return allowedRedirectOrigins().has(url.origin);
    }
    return false;
  } catch {
    return false;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function isAccessTokenUsable(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now() + ACCESS_SKEW_MS;
}

export type KeycloakTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
};

export async function exchangeRefreshToken(refreshToken: string): Promise<
  { ok: true; data: KeycloakTokenResponse } | { ok: false; status: number }
> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: keycloakClientId(),
    client_secret: keycloakClientSecret(),
    refresh_token: refreshToken,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), KEYCLOAK_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${keycloakServerIssuer()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as KeycloakTokenResponse };
  } catch {
    return { ok: false, status: 503 };
  } finally {
    clearTimeout(timeout);
  }
}

export function decodeJwtPerms(token: string): string[] {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  const realm = (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const client =
    (payload.resource_access as Record<string, { roles?: string[] }> | undefined)?.[
      keycloakClientId()
    ]?.roles ?? [];
  return [...realm, ...client];
}

export function accessTokenGrantsPlatformAdmin(accessToken: string): boolean {
  return hasPlatformAdminAccess(decodeJwtPerms(accessToken));
}

export function userFromAccessToken(token: string): { name: string; email?: string } {
  const payload = decodeJwtPayload(token);
  if (!payload) return { name: 'Operador' };
  const name =
    (payload.name as string) ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
    (payload.preferred_username as string) ||
    'Operador';
  return { name, email: payload.email as string | undefined };
}

export function expiresAtFromAccessToken(token: string, expiresInSec?: number): number {
  const payload = decodeJwtPayload(token);
  if (payload && typeof payload.exp === 'number') return payload.exp * 1000;
  return Date.now() + (expiresInSec ?? 3600) * 1000;
}

export type PublicSessionPayload = {
  user: { name: string; email?: string };
  expiresAt: number;
  permissions: string[];
};

export function publicSessionFromTokens(
  accessToken: string,
  expiresInSec?: number,
): PublicSessionPayload {
  return {
    user: userFromAccessToken(accessToken),
    expiresAt: expiresAtFromAccessToken(accessToken, expiresInSec),
    permissions: decodeJwtPerms(accessToken),
  };
}

export function setAuthCookies(
  res: NextResponse,
  tokens: KeycloakTokenResponse,
  opts?: { refreshFallback?: string },
) {
  if (tokens.access_token) {
    res.cookies.set(ACCESS_COOKIE, tokens.access_token, authCookieOptions(tokens.expires_in ?? 1800));
  }
  const refresh = tokens.refresh_token ?? opts?.refreshFallback;
  if (refresh) res.cookies.set(REFRESH_COOKIE, refresh, authCookieOptions());
  if (tokens.id_token) {
    res.cookies.set(ID_COOKIE, tokens.id_token, authCookieOptions(tokens.expires_in ?? 1800));
  }
}

export function clearAuthCookies(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ID_COOKIE]) {
    res.cookies.set(name, '', clearAuthCookieOptions());
  }
}

export type BffAccessResult =
  | { access: string; tokens?: KeycloakTokenResponse; refreshFallback?: string }
  | { access: null; clearCookies: boolean };

export async function resolveAccessTokenForBff(cookies: {
  get: (name: string) => { value?: string } | undefined;
}): Promise<BffAccessResult> {
  const accessRaw = cookies.get(ACCESS_COOKIE)?.value?.trim();
  if (accessRaw && isAccessTokenUsable(accessRaw)) {
    if (!accessTokenGrantsPlatformAdmin(accessRaw)) {
      return { access: null, clearCookies: true };
    }
    return { access: accessRaw };
  }
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value?.trim();
  if (!refreshToken) return { access: null, clearCookies: false };

  const exchanged = await exchangeRefreshToken(refreshToken);
  if (!exchanged.ok) {
    return { access: null, clearCookies: exchanged.status === 401 || exchanged.status === 400 };
  }
  if (!exchanged.data.access_token || !accessTokenGrantsPlatformAdmin(exchanged.data.access_token)) {
    return { access: null, clearCookies: true };
  }
  return {
    access: exchanged.data.access_token,
    tokens: exchanged.data,
    refreshFallback: refreshToken,
  };
}

export function applyBffTokenCookies(
  res: NextResponse,
  result: Extract<BffAccessResult, { access: string }>,
) {
  if (result.tokens) {
    setAuthCookies(res, result.tokens, { refreshFallback: result.refreshFallback });
  }
}

export function adminApiBase(): string {
  return process.env.ADMIN_API_URL ?? 'http://127.0.0.1:3103/api';
}

export function parseTokenBody(body: unknown): {
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
} {
  if (!body || typeof body !== 'object') return {};
  const row = body as Record<string, unknown>;
  return {
    code: typeof row.code === 'string' ? row.code : undefined,
    redirectUri: typeof row.redirectUri === 'string' ? row.redirectUri : undefined,
    codeVerifier: typeof row.codeVerifier === 'string' ? row.codeVerifier : undefined,
  };
}

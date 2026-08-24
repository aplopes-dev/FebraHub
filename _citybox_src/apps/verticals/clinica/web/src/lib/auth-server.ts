import type { NextResponse } from 'next/server';
import { displayNameFromJwtClaims } from './format-person-display-name';
import {
  ACCESS_COOKIE,
  ID_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
} from './auth-cookie';
import { hasBackofficeAccess } from './vertical-permissions';

/** Secret de dev do Keycloak local — convenção `<clientId>-dev-secret` (ADR C-17). */
const DEV_SECRET_FALLBACK = 'clinica-web-dev-secret';
/** Margem antes do exp do JWT para renovar cedo e evitar 401 em requests paralelos. */
const ACCESS_SKEW_MS = 60_000;

const REFRESH_CACHE_MAX_TTL_MS = 5 * 60_000;

/**
 * Issuer público (browser / OAuth redirect) — realm `citybox-clinica`.
 * Sem default: apontar para o realm errado por omissão de env é o defeito que o
 * ADR C-16 fecha.
 */
export function keycloakIssuer(): string {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER?.trim();
  if (!issuer) throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');
  return issuer;
}

/** Issuer para chamadas server-side (BFF → Keycloak). Evita hairpin via nginx. */
export function keycloakServerIssuer(): string {
  return process.env.KEYCLOAK_INTERNAL_ISSUER?.trim() || keycloakIssuer();
}

/** Client deste app no realm da clínica (`clinica-web`). Sem default. */
export function keycloakClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT?.trim();
  if (!clientId) throw new Error('NEXT_PUBLIC_KEYCLOAK_CLIENT não configurado');
  return clientId;
}

export function keycloakClientSecret(): string {
  const secret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('KEYCLOAK_CLIENT_SECRET não configurado');
  }
  return DEV_SECRET_FALLBACK;
}

const DEV_ORIGIN = 'http://127.0.0.1:3113';
const PROD_ORIGIN = 'https://clinica.citybox.com';

function allowedRedirectOrigins(): Set<string> {
  const origins = new Set([
    PROD_ORIGIN,
    'http://localhost:3113',
    'http://127.0.0.1:3113',
  ]);
  const extra = process.env.NEXT_PUBLIC_BACKOFFICE_ORIGIN?.trim();
  if (extra) {
    try {
      origins.add(new URL(extra).origin);
    } catch {
      // ignora valor inválido
    }
  }
  return origins;
}

/** Origem do app da clínica para redirects OAuth/logout (respeita Origin do browser em dev). */
export function backofficeOrigin(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_BACKOFFICE_ORIGIN?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // ignora valor inválido
    }
  }
  const origin = requestOrigin?.trim();
  if (origin && allowedRedirectOrigins().has(origin)) {
    return origin;
  }
  if (process.env.NODE_ENV === 'production') {
    return PROD_ORIGIN;
  }
  return DEV_ORIGIN;
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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    try {
      return JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64').toString('utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      return null;
    }
  }
}

export function isAccessTokenUsable(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 > Date.now() + ACCESS_SKEW_MS;
}

export type KeycloakTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
};

type RefreshExchangeResult =
  | { ok: true; data: KeycloakTokenResponse }
  | { ok: false; status: number };

/**
 * Dedupe de refresh in-process (singleton por pod Next.js).
 * Com N réplicas sem sticky session, pods distintos podem invalidar refresh tokens
 * uns dos outros se `revokeRefreshToken` estiver ativo no Keycloak.
 * Manter `revokeRefreshToken: false` até cache distribuído (Redis) ou session affinity.
 * @see apps/erp/web/docs/session-auth-debt.md
 */
let refreshInFlight: { token: string; promise: Promise<RefreshExchangeResult> } | null = null;

let refreshCache: {
  refreshToken: string;
  accessToken: string;
  data: KeycloakTokenResponse;
  expiresAtMs: number;
} | null = null;

function invalidateRefreshCacheForToken(token: string) {
  if (refreshCache?.refreshToken === token) {
    refreshCache = null;
  }
}

async function exchangeRefreshTokenOnce(refreshToken: string): Promise<RefreshExchangeResult> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: keycloakClientId(),
    client_secret: keycloakClientSecret(),
    refresh_token: refreshToken,
  });

  const res = await fetch(`${keycloakServerIssuer()}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status };
  }

  try {
    return { ok: true, data: JSON.parse(text) as KeycloakTokenResponse };
  } catch {
    return { ok: false, status: 502 };
  }
}

/** Evita corrida: duas renovações simultâneas com o mesmo refresh invalidam uma no Keycloak. */
export async function exchangeRefreshToken(refreshToken: string): Promise<RefreshExchangeResult> {
  const now = Date.now();
  if (
    refreshCache &&
    refreshCache.refreshToken === refreshToken &&
    refreshCache.expiresAtMs > now + ACCESS_SKEW_MS
  ) {
    return { ok: true, data: refreshCache.data };
  }

  if (refreshInFlight?.token === refreshToken) {
    return refreshInFlight.promise;
  }

  const promise = exchangeRefreshTokenOnce(refreshToken);
  refreshInFlight = { token: refreshToken, promise };

  try {
    const result = await promise;
    if (result.ok && result.data.access_token) {
      const nextRefresh = result.data.refresh_token ?? refreshToken;
      if (nextRefresh !== refreshToken) {
        invalidateRefreshCacheForToken(refreshToken);
      }
      const tokenExpiresAt = expiresAtFromAccessToken(
        result.data.access_token,
        result.data.expires_in,
      );
      refreshCache = {
        refreshToken: nextRefresh,
        accessToken: result.data.access_token,
        data: result.data,
        expiresAtMs: Math.min(tokenExpiresAt, now + REFRESH_CACHE_MAX_TTL_MS),
      };
    }
    return result;
  } finally {
    if (refreshInFlight?.promise === promise) {
      refreshInFlight = null;
    }
  }
}

export type BffAccessResult =
  | { access: string; tokens?: KeycloakTokenResponse; refreshFallback?: string }
  | { access: null; clearCookies: boolean };

/** Resolve access token para proxies — renova via refresh cookie se necessário. */
export async function resolveAccessTokenForBff(
  cookies: { get: (name: string) => { value?: string } | undefined },
): Promise<BffAccessResult> {
  const accessRaw = cookies.get(ACCESS_COOKIE)?.value?.trim();
  if (accessRaw && isAccessTokenUsable(accessRaw)) {
    return { access: accessRaw };
  }

  const refreshToken = cookies.get(REFRESH_COOKIE)?.value?.trim();
  if (!refreshToken) {
    return { access: null, clearCookies: false };
  }

  const exchanged = await exchangeRefreshToken(refreshToken);
  if (!exchanged.ok) {
    return {
      access: null,
      clearCookies: exchanged.status === 401 || exchanged.status === 400,
    };
  }

  const data = exchanged.data;
  if (!data.access_token || !accessTokenGrantsBackoffice(data.access_token)) {
    return { access: null, clearCookies: true };
  }

  return {
    access: data.access_token,
    tokens: data,
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

export function accessTokenGrantsBackoffice(accessToken: string): boolean {
  return hasBackofficeAccess(decodeJwtPerms(accessToken));
}

export function decodeJwtPerms(token: string): string[] {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  const realm = (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT?.trim() ?? '';
  const client =
    (payload.resource_access as Record<string, { roles?: string[] }> | undefined)?.[clientId]
      ?.roles ?? [];
  return [...realm, ...client];
}

export function userFromAccessToken(token: string): {
  name: string;
  email?: string;
  username?: string;
} {
  const payload = decodeJwtPayload(token);
  if (!payload) return { name: 'Usuário SSO' };
  const username = payload.preferred_username as string | undefined;
  return {
    name: displayNameFromJwtClaims(payload),
    email: payload.email as string | undefined,
    username,
  };
}

export function expiresAtFromAccessToken(token: string, expiresInSec?: number): number {
  const payload = decodeJwtPayload(token);
  if (payload && typeof payload.exp === 'number') {
    return payload.exp * 1000;
  }
  return Date.now() + (expiresInSec ?? 3600) * 1000;
}

export type PublicSessionPayload = {
  user: { name: string; email?: string; username?: string };
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
  tokens: {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  },
  opts?: { refreshFallback?: string },
) {
  if (tokens.access_token) {
    res.cookies.set(ACCESS_COOKIE, tokens.access_token, authCookieOptions(tokens.expires_in ?? 1800));
  }
  const refresh = tokens.refresh_token ?? opts?.refreshFallback;
  if (refresh) {
    res.cookies.set(REFRESH_COOKIE, refresh, authCookieOptions());
  }
  if (tokens.id_token) {
    res.cookies.set(ID_COOKIE, tokens.id_token, authCookieOptions(tokens.expires_in ?? 1800));
  }
}

export function clearAuthCookies(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ID_COOKIE]) {
    res.cookies.set(name, '', clearAuthCookieOptions());
  }
}

export function clinicaApiBase(): string {
  return process.env.CLINICA_API_URL ?? 'http://127.0.0.1:3172/api';
}

// `platformApiBase()` e `assertUserCanAccessStore()` foram removidos na Fase 9: o único
// upstream deste app é a clinica-api, e a autorização de loja passou a ser feita pelo
// `ClinicScopeGuard` dentro dela (o proxy fazia um round-trip HTTP por request e não
// protegia quem chamasse a API direto).

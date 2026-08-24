import type { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  ID_COOKIE,
  REFRESH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
} from './auth-cookie';

/** Renova o access token antes de ele expirar de fato. */
const ACCESS_SKEW_MS = 60_000;
const KEYCLOAK_FETCH_TIMEOUT_MS = 8_000;

/**
 * Issuer do realm PRÓPRIO do ERP (`citybox-erp`, ADR C-16). Sem default:
 * adivinhar realm ou client é como o app acabaria falando com o realm errado
 * em silêncio — melhor falhar (ADR C-17, bloco 6).
 */
export function keycloakIssuer(): string {
  const issuer =
    process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER?.trim() ||
    process.env.KEYCLOAK_ISSUER?.trim();
  if (!issuer) {
    throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');
  }
  return issuer;
}

/** Issuer usado servidor→Keycloak; separado para evitar hairpin de proxy. */
export function keycloakServerIssuer(): string {
  return process.env.KEYCLOAK_INTERNAL_ISSUER?.trim() || keycloakIssuer();
}

export function keycloakClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT?.trim();
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_KEYCLOAK_CLIENT não configurado');
  }
  return clientId;
}

export function keycloakClientSecret(): string {
  const secret = process.env.KEYCLOAK_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error('KEYCLOAK_CLIENT_SECRET não configurado');
  }
  return secret;
}

function allowedRedirectOrigins(): Set<string> {
  const origins = new Set([
    'http://localhost:3107',
    'http://127.0.0.1:3107',
  ]);
  const extra = process.env.NEXT_PUBLIC_BACKOFFICE_ORIGIN?.trim();
  if (extra) {
    try {
      origins.add(new URL(extra).origin);
    } catch {
      // configuração inválida não derruba o app — cai no default
    }
  }
  return origins;
}

/** Origem do app para redirects OAuth/logout (respeita o Origin do browser em dev). */
export function webOrigin(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_BACKOFFICE_ORIGIN?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // ignora
    }
  }
  const origin = requestOrigin?.trim();
  if (origin && allowedRedirectOrigins().has(origin)) return origin;
  return 'http://127.0.0.1:3107';
}

/**
 * Allow-list do `redirect_uri`: sem isso, um atacante mandaria o code para um
 * host dele. `http` só é aceito em loopback.
 */
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
    return JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * `sub` do token de sessão do usuário — usado pelo proxy fiscal para mandar
 * `X-Acting-Sub` à fiscal-api quando eleva pro token de serviço (BUG-01,
 * 2026-08-13): a `CompanyAccessPolicy` de lá precisa saber quem *de fato*
 * chamou, não só que "algum sistema interno" chamou.
 */
export function subFromAccessToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const sub = payload?.sub;
  return typeof sub === 'string' && sub.trim() ? sub.trim() : null;
}

/** Token sem `exp` é tratado como inutilizável — não dá para saber se venceu. */
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

type RefreshResult =
  | { ok: true; data: KeycloakTokenResponse }
  | { ok: false; status: number };

/**
 * Dedupe do refresh em andamento.
 *
 * O Keycloak invalida o refresh token a cada uso: N requisições paralelas
 * renovando ao mesmo tempo derrubariam a sessão umas das outras. In-process —
 * com múltiplos pods, é preciso `revokeRefreshToken: false` no realm (mesma
 * dívida registrada em `apps/erp/docs/session-auth-debt.md`).
 */
const refreshInFlight = new Map<string, Promise<RefreshResult>>();

export async function exchangeRefreshToken(
  refreshToken: string,
): Promise<RefreshResult> {
  const running = refreshInFlight.get(refreshToken);
  if (running) return running;

  const pending = doExchangeRefreshToken(refreshToken).finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, pending);
  return pending;
}

async function doExchangeRefreshToken(
  refreshToken: string,
): Promise<RefreshResult> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: keycloakClientId(),
    client_secret: keycloakClientSecret(),
    refresh_token: refreshToken,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), KEYCLOAK_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${keycloakServerIssuer()}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      },
    );
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as KeycloakTokenResponse };
  } catch {
    // Timeout ou rede: 503 para o chamador tratar como indisponibilidade.
    return { ok: false, status: 503 };
  } finally {
    clearTimeout(timeout);
  }
}

export function userFromAccessToken(token: string): {
  name: string;
  email?: string;
  username?: string;
} {
  const payload = decodeJwtPayload(token);
  if (!payload) return { name: 'Usuário' };
  const name =
    (payload.name as string) ||
    [payload.given_name, payload.family_name].filter(Boolean).join(' ') ||
    (payload.preferred_username as string) ||
    'Usuário';
  return {
    name,
    email: payload.email as string | undefined,
    username: payload.preferred_username as string | undefined,
  };
}

export function expiresAtFromAccessToken(
  token: string,
  expiresInSec?: number,
): number {
  const payload = decodeJwtPayload(token);
  if (payload && typeof payload.exp === 'number') return payload.exp * 1000;
  return Date.now() + (expiresInSec ?? 3600) * 1000;
}

export type PublicSessionPayload = {
  user: { name: string; email?: string; username?: string };
  expiresAt: number;
};

/**
 * O que o browser recebe sobre a sessão — identidade e validade, nada de
 * permissão: no ERP Comércio quem autoriza é o `Membership` no banco da API
 * (ver `api/AGENTS.md` §5.10), não claims do token.
 */
export function publicSessionFromTokens(
  accessToken: string,
  expiresInSec?: number,
): PublicSessionPayload {
  return {
    user: userFromAccessToken(accessToken),
    expiresAt: expiresAtFromAccessToken(accessToken, expiresInSec),
  };
}

export function setAuthCookies(
  res: NextResponse,
  tokens: KeycloakTokenResponse,
  opts?: { refreshFallback?: string },
) {
  if (tokens.access_token) {
    res.cookies.set(
      ACCESS_COOKIE,
      tokens.access_token,
      authCookieOptions(tokens.expires_in ?? 1800),
    );
  }
  // O Keycloak pode não devolver refresh novo; manter o anterior evita
  // deslogar o usuário sem motivo.
  const refresh = tokens.refresh_token ?? opts?.refreshFallback;
  if (refresh) res.cookies.set(REFRESH_COOKIE, refresh, authCookieOptions());
  if (tokens.id_token) {
    res.cookies.set(
      ID_COOKIE,
      tokens.id_token,
      authCookieOptions(tokens.expires_in ?? 1800),
    );
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

/**
 * Resolve o access token para as chamadas server-side, renovando pelo refresh
 * quando necessário.
 *
 * Diferente do `apps/erp` e do `admin`, **não checa permissão**: qualquer
 * usuário autenticado do realm pode entrar no app. O que ele enxerga depende do
 * vínculo (`Membership`) que a API valida a cada request.
 */
export async function resolveAccessTokenForBff(cookies: {
  get: (name: string) => { value?: string } | undefined;
}): Promise<BffAccessResult> {
  const accessRaw = cookies.get(ACCESS_COOKIE)?.value?.trim();
  if (accessRaw && isAccessTokenUsable(accessRaw)) {
    return { access: accessRaw };
  }

  const refreshToken = cookies.get(REFRESH_COOKIE)?.value?.trim();
  if (!refreshToken) return { access: null, clearCookies: false };

  const exchanged = await exchangeRefreshToken(refreshToken);
  if (!exchanged.ok) {
    // 400/401 = refresh morto (limpa os cookies); 503 = Keycloak fora do ar,
    // e aí não faz sentido derrubar a sessão do usuário.
    return {
      access: null,
      clearCookies: exchanged.status === 401 || exchanged.status === 400,
    };
  }
  if (!exchanged.data.access_token) {
    return { access: null, clearCookies: true };
  }
  return {
    access: exchanged.data.access_token,
    tokens: exchanged.data,
    refreshFallback: refreshToken,
  };
}

/** Regrava os cookies quando o refresh rodou no meio da requisição. */
export function applyBffTokenCookies(
  res: NextResponse,
  result: Extract<BffAccessResult, { access: string }>,
) {
  if (result.tokens) {
    setAuthCookies(res, result.tokens, {
      refreshFallback: result.refreshFallback,
    });
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
    codeVerifier:
      typeof row.codeVerifier === 'string' ? row.codeVerifier : undefined,
  };
}

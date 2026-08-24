import { NextRequest, NextResponse } from 'next/server';
import {
  accessTokenGrantsPlatformAdmin,
  clearAuthCookies,
  isAllowedRedirectUri,
  keycloakClientId,
  keycloakClientSecret,
  keycloakServerIssuer,
  parseTokenBody,
  publicSessionFromTokens,
  setAuthCookies,
} from '@/lib/auth-server';

const KEYCLOAK_FETCH_TIMEOUT_MS = 8_000;

export async function POST(req: NextRequest) {
  const body = parseTokenBody(await req.json());
  if (!body.code || !body.redirectUri || !body.codeVerifier) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (!isAllowedRedirectUri(body.redirectUri)) {
    return NextResponse.json({ error: 'invalid_redirect' }, { status: 400 });
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: keycloakClientId(),
    client_secret: keycloakClientSecret(),
    code: body.code,
    redirect_uri: body.redirectUri,
    code_verifier: body.codeVerifier,
  });

  const controller = new AbortController();
  const tokenTimeout = setTimeout(() => controller.abort(), KEYCLOAK_FETCH_TIMEOUT_MS);
  let tokenRes: Response;
  try {
    tokenRes = await fetch(`${keycloakServerIssuer()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json({ error: 'keycloak_timeout' }, { status: 503 });
  } finally {
    clearTimeout(tokenTimeout);
  }

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 401 });
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  };

  if (!tokens.access_token || !accessTokenGrantsPlatformAdmin(tokens.access_token)) {
    const response = NextResponse.json({ error: 'no_platform_admin_access' }, { status: 403 });
    clearAuthCookies(response);
    return response;
  }

  const session = publicSessionFromTokens(tokens.access_token, tokens.expires_in);
  const response = NextResponse.json(session);
  setAuthCookies(response, tokens);
  return response;
}

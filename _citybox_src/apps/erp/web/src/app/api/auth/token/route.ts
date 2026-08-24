import { NextRequest, NextResponse } from 'next/server';
import {
  isAllowedRedirectUri,
  keycloakClientId,
  keycloakClientSecret,
  keycloakServerIssuer,
  parseTokenBody,
  publicSessionFromTokens,
  setAuthCookies,
} from '@/lib/auth-server';

const KEYCLOAK_FETCH_TIMEOUT_MS = 8_000;

/**
 * Troca o `code` do callback OAuth pelos tokens e grava os cookies httpOnly.
 *
 * A troca acontece aqui, no servidor, porque exige o client secret — o browser
 * nunca o vê, e nunca vê os tokens tampouco.
 */
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
  const timeout = setTimeout(() => controller.abort(), KEYCLOAK_FETCH_TIMEOUT_MS);
  let tokenRes: Response;
  try {
    tokenRes = await fetch(
      `${keycloakServerIssuer()}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: controller.signal,
      },
    );
  } catch {
    return NextResponse.json({ error: 'keycloak_timeout' }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }

  if (!tokenRes.ok) {
    if (process.env.NODE_ENV !== 'production') {
      const detail = await tokenRes.text().catch(() => '');
      console.error(
        `[auth/token] Keycloak exchange failed status=${tokenRes.status} body=${detail.slice(0, 500)}`,
      );
    }
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 401 });
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  };

  if (!tokens.access_token) {
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 401 });
  }

  // Sem checagem de permissão: no ERP Comércio quem autoriza é o `Membership`
  // na API, não o token. Um usuário sem organização entra e cai na tela que
  // explica isso (ver /entrada).
  const session = publicSessionFromTokens(tokens.access_token, tokens.expires_in);
  const response = NextResponse.json(session);
  setAuthCookies(response, tokens);
  return response;
}

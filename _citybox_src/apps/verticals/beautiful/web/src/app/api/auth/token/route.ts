import { NextResponse } from 'next/server';
import {
  accessTokenGrantsBackoffice,
  clearAuthCookies,
  isAllowedRedirectUri,
  keycloakClientId,
  keycloakClientSecret,
  keycloakServerIssuer,
  parseTokenBody,
  publicSessionFromTokens,
  setAuthCookies,
} from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const { code, redirectUri, codeVerifier } = parseTokenBody(await req.json());
    if (!code?.trim() || !redirectUri?.trim() || !codeVerifier?.trim()) {
      return NextResponse.json({ error: 'Parâmetros OAuth inválidos' }, { status: 400 });
    }
    if (!isAllowedRedirectUri(redirectUri)) {
      return NextResponse.json({ error: 'redirect_uri inválido' }, { status: 400 });
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: keycloakClientId(),
      client_secret: keycloakClientSecret(),
      code: code.trim(),
      redirect_uri: redirectUri.trim(),
      code_verifier: codeVerifier.trim(),
    });

    const res = await fetch(`${keycloakServerIssuer()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const text = await res.text();
    if (!res.ok) {
      return new NextResponse(text || JSON.stringify({ error: 'token_exchange_failed' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(text) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 502 });
    }

    if (!accessTokenGrantsBackoffice(data.access_token)) {
      const response = NextResponse.json(
        { error: 'no_backoffice_access' },
        { status: 403 },
      );
      clearAuthCookies(response);
      return response;
    }

    const session = publicSessionFromTokens(data.access_token, data.expires_in);
    const response = NextResponse.json(session);
    setAuthCookies(response, data);
    return response;
  } catch {
    return NextResponse.json({ error: 'Falha na troca de token' }, { status: 500 });
  }
}

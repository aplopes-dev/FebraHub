import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth-cookie';
import {
  accessTokenGrantsBackoffice,
  clearAuthCookies,
  exchangeRefreshToken,
  publicSessionFromTokens,
  setAuthCookies,
} from '@/lib/auth-server';

export async function POST() {
  try {
    const jar = await cookies();
    const refreshToken = jar.get(REFRESH_COOKIE)?.value?.trim();

    if (!refreshToken) {
      const response = NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const exchanged = await exchangeRefreshToken(refreshToken);

    if (!exchanged.ok) {
      const response = NextResponse.json(
        { error: 'refresh_failed' },
        { status: exchanged.status === 401 || exchanged.status === 400 ? 401 : 502 },
      );
      if (exchanged.status === 401 || exchanged.status === 400) {
        clearAuthCookies(response);
      }
      return response;
    }

    const data = exchanged.data;
    if (!data.access_token) {
      const response = NextResponse.json({ error: 'Token ausente' }, { status: 502 });
      clearAuthCookies(response);
      return response;
    }

    if (!accessTokenGrantsBackoffice(data.access_token)) {
      const response = NextResponse.json({ error: 'no_backoffice_access' }, { status: 403 });
      clearAuthCookies(response);
      return response;
    }

    const session = publicSessionFromTokens(data.access_token, data.expires_in);
    const response = NextResponse.json(session);
    setAuthCookies(response, data, { refreshFallback: refreshToken });
    return response;
  } catch {
    const response = NextResponse.json({ error: 'Falha ao renovar sessão' }, { status: 500 });
    clearAuthCookies(response);
    return response;
  }
}

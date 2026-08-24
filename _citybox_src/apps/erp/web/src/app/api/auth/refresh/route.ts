import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  exchangeRefreshToken,
  publicSessionFromTokens,
  setAuthCookies,
} from '@/lib/auth-server';
import { REFRESH_COOKIE } from '@/lib/auth-cookie';

/**
 * Refresh explícito.
 *
 * O caminho normal é implícito (`resolveAccessTokenForBff` renova dentro de
 * `/api/auth/session` e dos proxies); esta rota existe para forçar a renovação
 * sem depender de outra chamada.
 */
export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value?.trim();
  if (!refreshToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const exchanged = await exchangeRefreshToken(refreshToken);
  if (!exchanged.ok || !exchanged.data.access_token) {
    const response = NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
    // 503 é Keycloak fora do ar — não custa a sessão do usuário.
    if (!exchanged.ok && exchanged.status !== 503) clearAuthCookies(response);
    return response;
  }

  const session = publicSessionFromTokens(
    exchanged.data.access_token,
    exchanged.data.expires_in,
  );
  const response = NextResponse.json(session);
  setAuthCookies(response, exchanged.data, { refreshFallback: refreshToken });
  return response;
}

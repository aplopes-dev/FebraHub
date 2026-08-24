import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  keycloakClientId,
  keycloakIssuer,
  webOrigin,
} from '@/lib/auth-server';
import { ID_COOKIE } from '@/lib/auth-cookie';

/**
 * Encerra a sessão local e devolve a URL do logout SSO.
 *
 * O `id_token_hint` é o que faz o Keycloak encerrar a sessão dele também — sem
 * ele, o próximo login voltaria direto, sem pedir credencial.
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const idToken = jar.get(ID_COOKIE)?.value;
  const origin = webOrigin(request.headers.get('origin'));

  const response = NextResponse.json({
    ok: true,
    logoutUrl: idToken
      ? `${keycloakIssuer()}/protocol/openid-connect/logout?${new URLSearchParams({
          client_id: keycloakClientId(),
          post_logout_redirect_uri: `${origin}/login?loggedOut=1`,
          id_token_hint: idToken,
        })}`
      : `${origin}/login?loggedOut=1`,
  });
  clearAuthCookies(response);
  return response;
}

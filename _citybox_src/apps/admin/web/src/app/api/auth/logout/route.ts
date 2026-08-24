import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminWebOrigin, clearAuthCookies, keycloakClientId, keycloakIssuer } from '@/lib/auth-server';
import { ID_COOKIE } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const jar = await cookies();
  const idToken = jar.get(ID_COOKIE)?.value;
  const origin = adminWebOrigin(request.headers.get('origin'));

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

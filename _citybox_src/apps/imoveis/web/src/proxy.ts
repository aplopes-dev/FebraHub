import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-cookie';

/**
 * Portão de rota — redireciona ao login antes de servir HTML privado.
 * Validação real (JWT, expiração) fica nos route handlers e na API.
 *
 * Também propaga `x-pathname` para o root layout (tema dark/light por rota no SSR).
 * Em Next 16 o convention é `proxy.ts` (não manter `middleware.ts` em paralelo).
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/auth/',
  '/api/',
  '/_next/',
  '/favicon',
  '/agents/',
  '/p/',
  '/d/',
  '/robots.txt',
  '/sitemap.xml',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const nextWithPath = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return nextWithPath();
  }

  const hasAnySession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

  if (!hasAnySession) {
    const loginUrl = new URL('/login?reauth=1', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithPath();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};

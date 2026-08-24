import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-cookie';

/**
 * Portão de rota do app (no Next 16 o middleware mora em `proxy.ts`).
 *
 * Checa apenas a **presença** do cookie de sessão — é o suficiente para não
 * servir o HTML de uma tela privada a quem não fez login. A validação de
 * verdade (assinatura, expiração, vínculo com a empresa) continua nos route
 * handlers, nos proxies e na API.
 *
 * Sem isso, a proteção só aconteceria depois da hidratação e o usuário veria a
 * tela privada piscar antes do redirect.
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/auth/',
  '/api/',
  '/_next/',
  '/favicon',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // O refresh basta: o access pode ter expirado e ser renovado no primeiro
  // request ao BFF. Derrubar aqui obrigaria a relogar a cada 30 min.
  const hasAnySession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

  if (!hasAnySession) {
    const loginUrl = new URL('/login?reauth=1', request.url);
    // `from` devolve o usuário à página que ele tentou abrir, depois do login.
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};

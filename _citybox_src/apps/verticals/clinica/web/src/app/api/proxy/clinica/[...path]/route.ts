import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  applyBffTokenCookies,
  clearAuthCookies,
  clinicaApiBase,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

  const UPSTREAM_TIMEOUT_MS = 60_000;

/**
 * Rotas que não operam sobre uma clínica específica e por isso não exigem `X-Store-Id`.
 * `members/me` é a descoberta de acesso: a pergunta é "onde este usuário tem acesso",
 * então exigir a clínica seria circular.
 */
const SCOPELESS_PATHS = ['v1/members/me', 'v1/members/roles'];

async function proxy(req: NextRequest, segments: string[]) {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  const storeId =
    req.headers.get('x-store-id')?.trim() ??
    ((req.method === 'GET' || req.method === 'HEAD')
      ? req.nextUrl.searchParams.get('storeId')?.trim()
      : undefined);

  const path = segments.join('/');
  const scopeless = SCOPELESS_PATHS.includes(path);

  if (!storeId && !scopeless) {
    return NextResponse.json({ error: 'X-Store-Id obrigatório' }, { status: 400 });
  }

  // A validação de acesso à clínica saiu daqui (PLAT-001 / Fase 9).
  // Antes, todo request pagava um round-trip síncrono ao platform-api
  // (`assertUserCanAccessStore`) — e, pior, quem chamasse a clinica-api sem passar por
  // este proxy não era checado por ninguém. Agora quem valida é o `ClinicScopeGuard`,
  // dentro da própria API: sem round-trip e sem caminho que escape da checagem.

  const upstreamSearch = new URLSearchParams(req.nextUrl.searchParams);
  upstreamSearch.delete('storeId');
  const query = upstreamSearch.toString();
  const target = `${clinicaApiBase()}/${path}${query ? `?${query}` : ''}`;
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Authorization', `Bearer ${accessResult.access}`);
  if (storeId) headers.set('X-Store-Id', storeId);

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) outHeaders.set('Content-Type', upstreamType);

    const response = new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
    if (accessResult.tokens) applyBffTokenCookies(response, accessResult);
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'upstream_timeout' }, { status: 504 });
    }
    const body: Record<string, string> = { error: 'proxy_error' };
    if (process.env.NODE_ENV === 'development' && err instanceof Error) {
      body.upstream = target;
      body.detail = err.message;
    }
    return NextResponse.json(body, { status: 502 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}

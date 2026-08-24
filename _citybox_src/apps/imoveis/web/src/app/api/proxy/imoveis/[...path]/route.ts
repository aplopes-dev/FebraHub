import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  applyBffTokenCookies,
  clearAuthCookies,
  defaultStoreId,
  imoveisApiBase,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

const UPSTREAM_TIMEOUT_MS = 60_000;

const SCOPELESS_PATHS = new Set(['v1/members/me', 'v1/members/roles']);

function isScopelessPath(path: string): boolean {
  return SCOPELESS_PATHS.has(path);
}

async function proxy(req: NextRequest, segments: string[]) {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  const pathKey = segments.join('/');
  const scopeless = isScopelessPath(pathKey);

  let storeId = req.headers.get('x-store-id')?.trim();
  if (!storeId && !scopeless) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      storeId = req.nextUrl.searchParams.get('storeId')?.trim();
    }
  }
  if (!storeId && !scopeless) {
    if (process.env.NODE_ENV === 'development') {
      storeId = defaultStoreId();
    } else {
      return NextResponse.json({ error: 'store_required' }, { status: 400 });
    }
  }

  const path = pathKey;
  const query = req.nextUrl.searchParams.toString();
  const target = `${imoveisApiBase()}/${path}${query ? `?${query}` : ''}`;

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

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
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

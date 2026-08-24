import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  applyBffTokenCookies,
  clearAuthCookies,
  adminApiBase,
  resolveAccessTokenForBff,
} from '@/lib/auth-server';

const UPSTREAM_TIMEOUT_MS = 30_000;

async function proxy(req: NextRequest, segments: string[]) {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    const response = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (accessResult.clearCookies) clearAuthCookies(response);
    return response;
  }

  const target = `${adminApiBase()}/${segments.join('/')}${req.nextUrl.search}`;
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Authorization', `Bearer ${accessResult.access}`);

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
    return NextResponse.json({ error: 'proxy_error' }, { status: 502 });
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

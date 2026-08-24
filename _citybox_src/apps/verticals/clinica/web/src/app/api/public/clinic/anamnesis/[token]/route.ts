import { NextRequest, NextResponse } from 'next/server';
import { clinicaApiBase } from '@/lib/auth-server';

const UPSTREAM_TIMEOUT_MS = 30_000;

type RouteContext = { params: Promise<{ token: string }> };

async function proxyPublicAnamnesis(
  req: NextRequest,
  token: string,
): Promise<NextResponse> {
  const target = `${clinicaApiBase()}/v1/public/anamnesis/${encodeURIComponent(token)}`;
  const init: RequestInit = {
    method: req.method,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };

  if (req.method === 'PATCH') {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) outHeaders.set('Content-Type', upstreamType);

    return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
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

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  return proxyPublicAnamnesis(req, token);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  return proxyPublicAnamnesis(req, token);
}

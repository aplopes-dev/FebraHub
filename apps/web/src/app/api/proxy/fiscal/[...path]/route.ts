import { NextRequest, NextResponse } from "next/server";
import { MOCK_API_ENABLED, mockApiResponse } from "@/lib/mock/mock-api";

/**
 * Proxy same-origin para o serviço fiscal.
 *
 * Mesmo papel do proxy `core`: o browser fala só com este endpoint e a URL do
 * serviço não vai para o bundle. Sem `FISCAL_API_URL` no ambiente, responde do
 * mock.
 *
 * **Sem autenticação, de propósito.** A versão de origem escolhia entre o token
 * do usuário e um service account do Keycloak conforme a rota, para resolver
 * autorização por Emitente. Nada disso sobrevive à troca de backend: quando o
 * serviço fiscal desta operação for definido, o esquema de autorização dele
 * entra aqui — e a decisão de qual identidade sai em cada rota se refaz junto,
 * não antes.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;

function fiscalBase(): string {
  return (process.env.FISCAL_API_URL ?? "http://127.0.0.1:3116/api").replace(
    /\/$/,
    "",
  );
}

async function proxy(req: NextRequest, segments: string[]) {
  if (MOCK_API_ENABLED) {
    return await mockApiResponse(
      segments,
      req.method,
      req.nextUrl.searchParams,
    );
  }

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const query = req.nextUrl.searchParams.toString();
  const target = `${fiscalBase()}/${segments.join("/")}${query ? `?${query}` : ""}`;

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) outHeaders.set("Content-Type", upstreamType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 504 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}

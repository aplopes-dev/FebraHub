import { NextRequest, NextResponse } from "next/server";
import { MOCK_API_ENABLED, mockApiResponse } from "@/lib/mock/mock-api";
import { MOCK_ACTOR_SCOPE_HEADER } from "@/lib/mock/mock-users-permissions";

/**
 * Proxy same-origin para a API do backend.
 *
 * O browser fala só com este endpoint; a URL real do backend nunca aparece no
 * bundle e não há CORS no meio. Enquanto `API_URL` não estiver definida, as
 * respostas vêm do mock (`src/lib/mock/`).
 *
 * **Sem autenticação, de propósito.** A camada de auth do produto de origem
 * (Keycloak/OAuth) foi removida; quando o `apps/api` entrar, é aqui que o
 * token dele passa a ser injetado — num lugar só, fora do alcance do
 * JavaScript da página.
 *
 * Escopo (`X-Organization-Id` / `X-Branch-Id`): normalmente vem nos headers
 * (fetch JS via `apiFetch`). Em GET/HEAD de `<img src>` o browser **não** manda
 * esses headers — aceitamos `?organizationId=` / `?branchId=`, convertendo para
 * header e removendo da query upstream.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** Headers de escopo repassados do cliente. A API valida cada um deles. */
const ORGANIZATION_HEADER = "x-organization-id";
const BRANCH_HEADER = "x-branch-id";

function apiBase(): string {
  return (process.env.API_URL ?? "http://127.0.0.1:3114/api").replace(/\/$/, "");
}

function forwardHeader(req: NextRequest, name: string): string | null {
  return req.headers.get(name)?.trim() || null;
}

function resolveScopeParam(
  req: NextRequest,
  headerName: string,
  queryName: string,
): string | null {
  const fromHeader = forwardHeader(req, headerName);
  if (fromHeader) return fromHeader;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  return req.nextUrl.searchParams.get(queryName)?.trim() || null;
}

async function proxy(req: NextRequest, segments: string[]) {
  if (MOCK_API_ENABLED) {
    const bodyText =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.text()
        : null;
    return mockApiResponse(
      segments,
      req.method,
      req.nextUrl.searchParams,
      bodyText,
      req.headers.get(MOCK_ACTOR_SCOPE_HEADER),
    );
  }

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const organizationId = resolveScopeParam(
    req,
    ORGANIZATION_HEADER,
    "organizationId",
  );
  if (organizationId) headers.set("X-Organization-Id", organizationId);

  const branchId = resolveScopeParam(req, BRANCH_HEADER, "branchId");
  if (branchId) headers.set("X-Branch-Id", branchId);

  const upstreamSearch = new URLSearchParams(req.nextUrl.searchParams);
  upstreamSearch.delete("organizationId");
  upstreamSearch.delete("branchId");
  const query = upstreamSearch.toString();
  const target = `${apiBase()}/${segments.join("/")}${query ? `?${query}` : ""}`;

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

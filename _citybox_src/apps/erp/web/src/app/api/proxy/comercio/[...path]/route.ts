import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  applyBffTokenCookies,
  clearAuthCookies,
  resolveAccessTokenForBff,
} from "@/lib/auth-server";

/**
 * Proxy same-origin para a `erp-api` (:3114).
 *
 * O browser fala com este endpoint mandando só o cookie httpOnly; é aqui que o
 * access token do Keycloak entra na requisição. Assim o token nunca fica ao
 * alcance do JavaScript da página.
 *
 * Formato copiado de `apps/erp/src/app/api/proxy/food/[...path]/route.ts`.
 *
 * Escopo (`X-Organization-Id` / `X-Branch-Id`): normalmente vem nos headers
 * (fetch JS via `comercioFetch`). Em GET/HEAD de `<img src>` o browser **não**
 * manda esses headers — aceitamos `?organizationId=` / `?branchId=` (igual o
 * proxy food com `?storeId=`), convertendo para header e removendo da query
 * upstream.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** Headers de escopo repassados do cliente. A API valida cada um deles. */
const ORGANIZATION_HEADER = "x-organization-id";
const BRANCH_HEADER = "x-branch-id";
const STORE_HEADER = "x-store-id";

function apiBase(): string {
  return (
    process.env.ERP_API_URL?.replace(/\/$/, "") ??
    "http://127.0.0.1:3114/api"
  );
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
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);

  if (accessResult.access === null) {
    // 401 e não redirect: quem chama é fetch, não navegação. O cliente trata
    // (`fetchWithSession` tenta renovar; o RequireAuth manda para o login).
    const unauthorized = NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
    if (accessResult.clearCookies) clearAuthCookies(unauthorized);
    return unauthorized;
  }

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Authorization", `Bearer ${accessResult.access}`);

  // Escopo vem do cliente e é validado na API: o `TenantContextGuard` confere
  // o vínculo (`Membership`) e o acesso à unidade a cada request. Forjar o
  // header não abre porta nenhuma — só devolve 403.
  const organizationId = resolveScopeParam(
    req,
    ORGANIZATION_HEADER,
    "organizationId",
  );
  if (organizationId) headers.set("X-Organization-Id", organizationId);

  const branchId = resolveScopeParam(req, BRANCH_HEADER, "branchId");
  if (branchId) headers.set("X-Branch-Id", branchId);

  // Interino: o módulo `catalog` da API ainda é escopado por loja. Some quando
  // ele migrar para organização + unidade (ver api/AGENTS.md §5.4).
  const storeId = resolveScopeParam(req, STORE_HEADER, "storeId");
  if (storeId) headers.set("X-Store-Id", storeId);

  const upstreamSearch = new URLSearchParams(req.nextUrl.searchParams);
  upstreamSearch.delete("organizationId");
  upstreamSearch.delete("branchId");
  upstreamSearch.delete("storeId");
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

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
    // Se o token foi renovado no meio do caminho, o cookie novo volta junto.
    applyBffTokenCookies(response, accessResult);
    return response;
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 504 },
    );
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

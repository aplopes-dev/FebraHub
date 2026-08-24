import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  applyBffTokenCookies,
  clearAuthCookies,
  resolveAccessTokenForBff,
  subFromAccessToken,
} from "@/lib/auth-server";
import { getFiscalServiceAccessToken } from "@/lib/api/fiscal-service-token";
import {
  resolveCallerFiscalIdentity,
  resolveFiscalDocumentOwnerCompanyId,
} from "@/lib/api/fiscal-tenant-guard";
import { resolveOrgPosDocumentModel } from "@/lib/api/pos-fiscal-model-guard";

/**
 * Proxy same-origin para a `fiscal-api` (:3116).
 *
 * Mesmo padrão de `app/api/proxy/comercio/` — o browser fala só com este
 * endpoint mandando o cookie httpOnly da sessão; é aqui que o gate de acesso
 * acontece (usuário precisa de sessão erp-web válida), para o JavaScript da
 * página nunca ver nenhum token.
 *
 * ⚠️ **Duas identidades de saída, por design (achado 2026-08-13).** A
 * `fiscal-api` autoriza por role de Keycloak (`fiscal_operator`/
 * `platform.admin`) e nenhum usuário final do `citybox-backoffice` tem essa
 * role — repassar o token do usuário dava 403 até numa leitura inofensiva
 * ("o Emitente existe?"), e a tela mostrava erro genérico em vez do aviso
 * correto. A correção óbvia (token de serviço `citybox-fiscal-service` pra
 * tudo) abriria acesso **cross-tenant**: a `fiscal-api` delega autorização
 * por Emitente para "o sistema chamador" (ver
 * `services/fiscal-api/AGENTS.md`, FR-014/FR-015) — sem um usuário dono do
 * token pra checar, qualquer request coberto pelo token de serviço vale pra
 * qualquer Emitente. `resolveCallerFiscalIdentity` fecha esse buraco, mas só
 * pras formas de rota abaixo — não é viável (nem seguro) tentar cobrir de
 * cabeça as ~40 rotas da fiscal-api aqui.
 *
 * Por isso o proxy escolhe a identidade de saída por rota:
 * - **Rotas com `companyId` reconhecível** — `/v1/companies` (list-by-cnpj e
 *   create) · `/v1/companies/:id[...]` (perfil, CSC, certificados, séries) ·
 *   `GET /v1/certificates/:id/status?companyId=` (BUG-03, allowlist explícito
 *   em `isCertificateStatusRoute`) · `GET /v1/fiscal-documents?companyId=`
 *   (lista, allowlist explícito em `isFiscalDocumentsListRoute` — spec
 *   erp/030, B1: reintroduzida depois que o allowlist estreito da 029 a
 *   excluiu por engano ao fechar o CRITICAL) — nenhuma dessas usa o
 *   disjunto genérico `Boolean(queryCompanyId)`; essa generalidade foi o
 *   CRITICAL do security-review da spec erp/029, ver comentário de
 *   `isCertificateStatusRoute` abaixo. Todas usam o
 *   **token de serviço**, com o `companyId`/`cnpj` **resolvido no servidor**
 *   a partir da sessão do usuário (nunca aceito do que o cliente mandou), e
 *   o `sub` do usuário real vai no header `X-Acting-Sub` (BUG-01,
 *   2026-08-13) — a `StoreMembershipCompanyAccessPolicy` da fiscal-api
 *   resolve dono por `sub` → `platform.members` → `store_members`, e o
 *   service account não é membro de loja nenhuma; sem o header ela nega
 *   tudo (404 `CompanyNotFoundError`), mesmo com o `companyId` certo.
 * - **`/v1/nfe/:id/xml|danfe` e `/v1/nfse/:id/xml|danfse`** (spec erp/029,
 *   download de XML/DANFE/DANFSE) — sem `companyId` no path/query, então
 *   `isCompanyScopedRoute` não as pega. Resolvidas por consulta:
 *   `resolveFiscalDocumentOwnerCompanyId` busca o `companyId` real do
 *   documento (`GET /v1/fiscal-documents/:id`, token de serviço) e só eleva
 *   quando ele bate com `identity.companyId` da organização ativa do
 *   usuário. Fail-closed por construção — qualquer falha na consulta (rede,
 *   404, documento sem dono) devolve `null`, que nunca bate com um
 *   `companyId` real, e a chamada de download cai no token do usuário (403
 *   na fiscal-api, mesmo comportamento seguro do resto das rotas abaixo).
 *   Quando a elevação é confirmada, o header `X-Company-Id` também vai na
 *   chamada upstream (`documentOwnerCompanyId`, spec erp/030, D3) — DANFE/
 *   DANFSE exigem esse header via `@CompanyId()` na fiscal-api; XML não,
 *   mas mandar sempre que eleva é uniforme e inofensivo.
 * - **Todo o resto** (cancelamento/correção/inutilização de NF-e/NFC-e/NFS-e,
 *   ativar certificado, mutar sequência por id, `sefaz-status`, etc.) segue
 *   usando **o token do próprio usuário** — mesmo comportamento de antes
 *   desta correção: sem role, dá 403. Não é bonito (essas rotas continuam
 *   inacessíveis pra usuário comum), mas é **seguro por padrão**: elevar o
 *   token só onde a checagem de dono também existe, nunca "por enquanto, até
 *   eu lembrar de proteger". Cobrir essas rotas (autorização por Emitente
 *   dentro da própria fiscal-api, ou um resolvedor de dono por recurso aqui)
 *   é follow-up — achado do security-review, não threat model novo.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;
const FORBIDDEN_COMPANY = NextResponse.json(
  { error: "forbidden_company" },
  { status: 403 },
);
const MISSING_ORG_HEADER = NextResponse.json(
  { error: "organization_header_required" },
  { status: 400 },
);
/// spec erp/024, FR-009 — a fiscal-api nunca vê `pos_fiscal_settings`; este
/// bloqueio acontece só aqui, ANTES do fetch upstream.
const CSC_REMOVAL_BLOCKED = NextResponse.json(
  {
    error: "csc_removal_blocked_pos_model_65",
    message:
      "O PDV está configurado para emitir NFC-e (Modelo 65). Troque o modelo do PDV em Configurações do PDV antes de remover o CSC.",
  },
  { status: 409 },
);

function apiBase(): string {
  return (
    process.env.FISCAL_API_URL?.replace(/\/$/, "") ??
    "http://127.0.0.1:3116/api"
  );
}

/**
 * `["v1","companies", ":id", ...]` → `:id`; ausente nos outros formatos.
 * Comparação case-insensitive e tolerante a segmento vazio (`//`) — igual o
 * Express por baixo do Nest resolve rota, pra não abrir uma forma de escapar
 * do reconhecimento aqui e cair sem querer no branch "não precisa de dono"
 * (achado security-review: fail-open por casing/segmento vazio).
 */
function normalizedSegments(segments: string[]): string[] {
  return segments.map((segment) => segment.toLowerCase());
}

function companyIdFromPath(segments: string[]): string | null {
  const norm = normalizedSegments(segments);
  if (norm[0] === "v1" && norm[1] === "companies" && segments[2]) {
    return segments[2];
  }
  return null;
}

function isCompaniesListOrCreate(segments: string[]): boolean {
  const norm = normalizedSegments(segments);
  return norm[0] === "v1" && norm[1] === "companies" && segments.length === 2;
}

/**
 * `GET /v1/certificates/:id/status?companyId=` (BUG-03, 2026-08-13) — a única
 * rota cujo `companyId` de dono vem por query string em vez de path. Um
 * allowlist explícito, não "qualquer rota com `?companyId=`" (achado
 * security-review, spec erp/029): a versão antiga do disjunto de
 * `isCompanyScopedRoute` batia em **qualquer** path que carregasse essa
 * query, incluindo `/v1/nfe/:id/xml` — um atacante que soubesse o
 * `companyId` da própria organização (legítimo, visível em Configurações
 * fiscais) conseguia anexá-lo como query em `/v1/nfe/:victim-id/xml` e cair
 * neste branch (token de serviço, só validando "a query bate com o meu
 * companyId" — nunca "o documento do path pertence a ele"), furando por
 * completo o resolvedor de dono de `fiscalDocumentDownloadId` abaixo.
 */
function isCertificateStatusRoute(segments: string[]): boolean {
  const norm = normalizedSegments(segments);
  return (
    norm[0] === "v1" &&
    norm[1] === "certificates" &&
    Boolean(segments[2]) &&
    norm[3] === "status" &&
    segments.length === 4
  );
}

/**
 * `GET /v1/fiscal-documents` (lista, `companyId` por query) — a segunda rota
 * legítima com `companyId` via query string (spec erp/030, B1). Achado ao
 * investigar por que "Facilita NF-e não carrega": a listagem em si migrou
 * para o erp-api (`comercioFetch`, não passa mais por este proxy), mas essa
 * rota da fiscal-api continua existindo e é testada/usada diretamente — o
 * allowlist estreito da spec 029 (só `isCertificateStatusRoute`) a excluiu
 * por engano ao fechar o CRITICAL. `segments.length===2` exclui
 * `/v1/fiscal-documents/:id` (resolvido só server-to-server, nunca pelo
 * browser) e `/v1/fiscal-documents/summary`.
 */
function isFiscalDocumentsListRoute(
  segments: string[],
  method: string,
): boolean {
  const norm = normalizedSegments(segments);
  return (
    method === "GET" &&
    norm[0] === "v1" &&
    norm[1] === "fiscal-documents" &&
    segments.length === 2
  );
}

/** Rotas cuja identidade de saída é o token de serviço (dono verificado). */
function isCompanyScopedRoute(
  segments: string[],
  queryCompanyId: string | null,
  method: string,
): boolean {
  return (
    Boolean(companyIdFromPath(segments)) ||
    (Boolean(queryCompanyId) &&
      (isCertificateStatusRoute(segments) ||
        isFiscalDocumentsListRoute(segments, method))) ||
    isCompaniesListOrCreate(segments)
  );
}

/**
 * `/v1/sequences/:id[...]` (ajustar número, ativar/desativar, excluir — BUG-03).
 * Diferente das rotas acima, o proxy **não** valida o dono aqui: os use
 * cases de `fiscal-sequences` já resolvem `sequence.companyId` no servidor
 * (fonte autoritativa, não o path) e checam via `CompanyAccessPolicy` com o
 * `sub` real propagado por `X-Acting-Sub` (BUG-01) — checagem mais forte do
 * que o proxy conseguiria replicar aqui sem duplicar a consulta.
 */
function isSequenceResourceRoute(segments: string[]): boolean {
  const norm = normalizedSegments(segments);
  return norm[0] === "v1" && norm[1] === "sequences" && Boolean(segments[2]);
}

const FISCAL_DOCUMENT_DOWNLOAD_SUFFIXES = ["xml", "danfe", "danfse"];

/**
 * `/v1/nfe/:id/xml|danfe` e `/v1/nfse/:id/xml|danfse` (spec erp/029) — o id
 * no path é o `documentId` da fiscal-api, resolvido pelo dono via
 * `resolveFiscalDocumentOwnerCompanyId` antes de decidir a identidade de
 * saída (ver cabeçalho do arquivo).
 */
function fiscalDocumentDownloadId(segments: string[]): string | null {
  const norm = normalizedSegments(segments);
  const isNfeOrNfse = norm[0] === "v1" && (norm[1] === "nfe" || norm[1] === "nfse");
  if (!isNfeOrNfse) return null;
  if (!segments[2] || segments.length !== 4) return null;
  if (!FISCAL_DOCUMENT_DOWNLOAD_SUFFIXES.includes(norm[3])) return null;
  return segments[2];
}

/**
 * `DELETE /v1/companies/:id/csc` (spec erp/024, Parte B) — só esta rota tem o
 * guard de Modelo 65. **Tolerante a segmento vazio** (`//csc` ou um trailing
 * extra), igual `companyIdFromPath`/`isCompanyScopedRoute` — um `length`
 * exato aqui destoaria do resto do arquivo e abriria a mesma classe de
 * fail-open por casing/segmento que o security-review já corrigiu nos outros
 * matchers (achado react-review, spec erp/024): uma rota que ainda cai em
 * `isCompanyScopedRoute` (token de serviço) mas escapa deste matcher pularia
 * o bloqueio de Modelo 65 em silêncio.
 */
function isClearCscRoute(segments: string[]): boolean {
  const norm = normalizedSegments(segments);
  return (
    norm[0] === "v1" &&
    norm[1] === "companies" &&
    Boolean(segments[2]) &&
    norm[3] === "csc"
  );
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

  const pathCompanyId = companyIdFromPath(segments);
  const queryCompanyId = req.nextUrl.searchParams.get("companyId");
  const listOrCreateCompany = isCompaniesListOrCreate(segments);
  const companyScoped = isCompanyScopedRoute(
    segments,
    queryCompanyId,
    req.method,
  );

  const query = new URLSearchParams(req.nextUrl.searchParams);
  let bodyOverride: BodyInit | undefined;
  // Default seguro: token do próprio usuário (comportamento de sempre — sem
  // role fiscal, 403 na fiscal-api). Só sobe pra token de serviço nas rotas
  // com dono verificado abaixo.
  let outboundToken = accessResult.access;
  let usingServiceToken = false;
  // spec erp/030, D3 — `X-Company-Id` upstream só quando a elevação do
  // branch de download é confirmada (DANFE/DANFSE exigem esse header via
  // `@CompanyId()` na fiscal-api; XML não, mas mandar não atrapalha).
  let documentOwnerCompanyId: string | null = null;

  if (companyScoped) {
    const organizationId = req.headers.get("x-organization-id")?.trim();
    if (!organizationId) return MISSING_ORG_HEADER;

    let serviceToken: string;
    try {
      serviceToken = await getFiscalServiceAccessToken();
    } catch {
      // Config ausente ou Keycloak fora do ar — não é culpa da sessão do
      // usuário (já validada acima), então 503, não 401.
      return NextResponse.json(
        { error: "fiscal_service_unavailable" },
        { status: 503 },
      );
    }

    const identity = await resolveCallerFiscalIdentity(
      accessResult.access,
      organizationId,
      serviceToken,
    );
    if (!identity) return FORBIDDEN_COMPANY;

    if (listOrCreateCompany && req.method === "GET") {
      // Lista por CNPJ (achar o Emitente da própria org) — o CNPJ pedido é
      // sempre o resolvido pelo servidor, nunca o que a query mandou.
      query.set("cnpj", identity.cnpj);
    } else if (listOrCreateCompany && req.method === "POST") {
      // Criação do Emitente (provisionamento) — o CNPJ do corpo precisa bater
      // com o da organização ativa; corpo é reconstruído já validado.
      let payload: Record<string, unknown>;
      try {
        payload = (await req.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      if (payload.cnpj !== identity.cnpj) return FORBIDDEN_COMPANY;
      bodyOverride = JSON.stringify(payload);
    } else {
      // Rotas com companyId explícito (path ou query): tem que ser o mesmo
      // Emitente da organização ativa do usuário.
      const requestedCompanyId = pathCompanyId ?? queryCompanyId;
      if (!identity.companyId || requestedCompanyId !== identity.companyId) {
        return FORBIDDEN_COMPANY;
      }
      // Canonicaliza — `?companyId=a&companyId=b` só teria o primeiro valor
      // checado acima; reescrever pro valor já verificado evita que um valor
      // duplicado divergente chegue à fiscal-api (achado security-review).
      if (queryCompanyId) query.set("companyId", identity.companyId);

      // spec erp/024, FR-009: remover o CSC com o PDV em Modelo 65 deixaria
      // o caixa configurado para NFC-e sem conseguir montar o QR Code.
      // Consulta a erp-api com o token do PRÓPRIO usuário (não o de
      // serviço) — dono já verificado acima, nada novo pra autorizar aqui.
      if (req.method === "DELETE" && isClearCscRoute(segments)) {
        const model = await resolveOrgPosDocumentModel(
          accessResult.access,
          organizationId,
        );
        if (model === "MODEL_65") return CSC_REMOVAL_BLOCKED;
      }
    }

    outboundToken = serviceToken;
    usingServiceToken = true;
  } else if (fiscalDocumentDownloadId(segments)) {
    // spec erp/029 — download de XML/DANFE/DANFSE. Sem companyId no path;
    // resolve o dono do documento por consulta e só eleva se bater com a
    // organização ativa do usuário. Qualquer etapa que falhar (sem
    // organizationId, sem token de serviço, dono não resolvido, dono
    // diferente) deixa `outboundToken` no default (token do usuário) —
    // fail-closed por construção, nunca um `return` cedo que poderia ser
    // esquecido de replicar aqui no futuro.
    const organizationId = req.headers.get("x-organization-id")?.trim();
    if (organizationId) {
      try {
        const serviceToken = await getFiscalServiceAccessToken();
        const identity = await resolveCallerFiscalIdentity(
          accessResult.access,
          organizationId,
          serviceToken,
        );
        const documentId = fiscalDocumentDownloadId(segments);
        const ownerCompanyId = documentId
          ? await resolveFiscalDocumentOwnerCompanyId(documentId, serviceToken)
          : null;
        if (
          identity?.companyId &&
          ownerCompanyId &&
          ownerCompanyId === identity.companyId
        ) {
          outboundToken = serviceToken;
          usingServiceToken = true;
          documentOwnerCompanyId = identity.companyId;
        }
      } catch {
        // Config ausente ou Keycloak fora do ar — cai no default seguro
        // (token do usuário), não é um 503 aqui porque a rota ainda pode
        // seguir (só sem elevação, a fiscal-api vai recusar com 403).
      }
    }
  } else if (isSequenceResourceRoute(segments)) {
    // BUG-03 (2026-08-13): sem companyId no path pra validar aqui — eleva de
    // qualquer forma porque o use case já valida o dono real do lado de
    // dentro (ver comentário de `isSequenceResourceRoute`). `X-Acting-Sub`
    // abaixo é o que faz essa checagem funcionar de verdade.
    try {
      outboundToken = await getFiscalServiceAccessToken();
      usingServiceToken = true;
    } catch {
      return NextResponse.json(
        { error: "fiscal_service_unavailable" },
        { status: 503 },
      );
    }
  }

  // BUG-01 (2026-08-13): a fiscal-api resolve `CompanyAccessPolicy` pelo
  // `sub` de quem chamou — com o token de serviço isso seria o service
  // account, sem participação em loja nenhuma. Manda o `sub` do usuário real
  // num header que a fiscal-api só aceita vindo do client de serviço.
  // Fail-closed: sem `sub` decodificável, não dá pra atribuir a chamada —
  // nega em vez de deixar a fiscal-api cair no `sub: 'unknown'` (que ela já
  // nega, mas a decisão pertence ao proxy que sabe o motivo).
  let actingSub: string | null = null;
  if (usingServiceToken) {
    actingSub = subFromAccessToken(accessResult.access);
    if (!actingSub) return FORBIDDEN_COMPANY;
  }

  const headers = new Headers();
  if (documentOwnerCompanyId) {
    headers.set("X-Company-Id", documentOwnerCompanyId);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Authorization", `Bearer ${outboundToken}`);
  if (actingSub) headers.set("X-Acting-Sub", actingSub);

  const queryString = query.toString();
  const target = `${apiBase()}/${segments.join("/")}${queryString ? `?${queryString}` : ""}`;

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  if (bodyOverride !== undefined) {
    init.body = bodyOverride;
  } else if (req.method !== "GET" && req.method !== "HEAD") {
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

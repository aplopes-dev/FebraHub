/**
 * Isolamento entre organizações no proxy `/api/proxy/fiscal`.
 *
 * O Bearer que chega à fiscal-api é um token de **serviço**
 * (`getFiscalServiceAccessToken`) — a fiscal-api não sabe mais, pelo token,
 * de qual organização é a requisição. Sem essa checagem, qualquer usuário
 * autenticado no erp-web poderia trocar o `companyId` na URL/query (visível
 * no devtools) e ler ou escrever o Emitente fiscal de **outra** organização
 * (achado 2026-08-13, mesma classe do CRITICAL cross-tenant corrigido na
 * emissão de NFS-e — lá resolvido no erp-api; aqui resolvido no proxy, único
 * lugar que enxerga tanto a sessão do usuário quanto o token de serviço).
 *
 * Resolve o `companyId` esperado a partir da sessão do **usuário chamador**
 * (não do que a requisição pediu):
 * 1. `GET {ERP_API_URL}/v1/organizations/current` com o token do usuário +
 *    `X-Organization-Id` — a `erp-api` já valida que o usuário tem
 *    `Membership` nessa organização (mesma checagem usada em toda a app).
 * 2. `GET {FISCAL_API_URL}/v1/companies?cnpj=` (token de serviço) — resolve o
 *    `Company.id` da fiscal-api pelo CNPJ da organização.
 */

const UPSTREAM_TIMEOUT_MS = 10_000;

/// Exportado: `pos-fiscal-model-guard.ts` (spec erp/024, FR-009) também
/// precisa falar com a erp-api, mesma base — evita duplicar a leitura do env.
export function erpApiBase(): string {
  return process.env.ERP_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3114/api";
}

function fiscalApiBase(): string {
  return (
    process.env.FISCAL_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3116/api"
  );
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveCallerCnpj(
  userAccessToken: string,
  organizationId: string,
): Promise<string | null> {
  const data = await fetchJson(`${erpApiBase()}/v1/organizations/current`, {
    Authorization: `Bearer ${userAccessToken}`,
    "X-Organization-Id": organizationId,
  });
  const document = (data as { data?: { document?: unknown } } | null)?.data
    ?.document;
  return typeof document === "string" && document.trim() ? document.trim() : null;
}

async function resolveCompanyIdByCnpj(
  serviceToken: string,
  cnpj: string,
): Promise<string | null> {
  const query = new URLSearchParams({ cnpj, active: "true" });
  const data = await fetchJson(`${fiscalApiBase()}/v1/companies?${query}`, {
    Authorization: `Bearer ${serviceToken}`,
  });
  const first = (data as { data?: Array<{ id?: unknown }> } | null)?.data?.[0];
  const id = first?.id;
  return typeof id === "string" && id ? id : null;
}

/**
 * Dono de um documento fiscal (spec erp/029) — `GET /v1/nfe/:id/xml|danfe` e
 * `GET /v1/nfse/:id/xml|danfse` não têm `companyId` no path/query, então o
 * proxy não pode validar o dono pelo padrão de `isCompanyScopedRoute`. Em vez
 * disso, resolve o `companyId` real do documento (`GET
 * /v1/fiscal-documents/:id`, token de serviço — a única identidade que essa
 * consulta aceita) e quem chama compara com `identity.companyId` antes de
 * elevar a chamada de download em si. **Fail-closed por construção**:
 * qualquer falha (rede, 404, documento sem companyId) devolve `null`, e
 * `null` nunca bate com um `companyId` real — a rota de download cai no
 * token do usuário, que a fiscal-api recusa sem a role certa (mesmo
 * comportamento seguro documentado no cabeçalho do proxy).
 */
export async function resolveFiscalDocumentOwnerCompanyId(
  documentId: string,
  serviceToken: string,
): Promise<string | null> {
  const data = await fetchJson(`${fiscalApiBase()}/v1/fiscal-documents/${documentId}`, {
    Authorization: `Bearer ${serviceToken}`,
  });
  const companyId = (data as { data?: { companyId?: unknown } } | null)?.data
    ?.companyId;
  return typeof companyId === "string" && companyId ? companyId : null;
}

export type CallerFiscalIdentity = { cnpj: string; companyId: string | null };

/**
 * Identidade fiscal do usuário chamador — CNPJ sempre resolvido pela sessão
 * (nunca pelo que o cliente mandou); `companyId` é `null` quando o Emitente
 * ainda não foi provisionado nessa organização (estado válido — "não
 * configurado ainda", não erro).
 */
export async function resolveCallerFiscalIdentity(
  userAccessToken: string,
  organizationId: string,
  serviceToken: string,
): Promise<CallerFiscalIdentity | null> {
  const cnpj = await resolveCallerCnpj(userAccessToken, organizationId);
  if (!cnpj) return null;
  const companyId = await resolveCompanyIdByCnpj(serviceToken, cnpj);
  return { cnpj, companyId };
}

import {
  isAccessTokenUsable,
  keycloakIssuer,
  type KeycloakTokenResponse,
} from "@/lib/auth-server";

/**
 * Token de serviço (client_credentials) para chamadas **servidor→fiscal-api**.
 *
 * A `fiscal-api` autoriza por *role* do Keycloak (`fiscal_operator` /
 * `platform.admin`, ver `services/fiscal-api/AGENTS.md` FR-015 — "v1 restrito
 * a clientes internos"), não pelas permissões `org.view`/`store.catalog.manage`
 * da erp-api. Repassar o token do **usuário final** (login PKCE do
 * `citybox-backoffice`) para a fiscal-api não funciona para a imensa maioria
 * dos usuários: nenhuma role do realm dá `fiscal_operator` a um usuário comum
 * (achado 2026-08-13, ao testar a área Fiscal logado como `lojista` — a fiscal-api
 * devolvia 403 na simples checagem "o Emitente existe?", e o front mostrava
 * "Não foi possível carregar" em vez do aviso correto "emitente não configurado").
 *
 * Client `fiscal-m2m` (realm `citybox-erp`, Service Accounts, role
 * `fiscal_operator`). **Não é mais** `citybox-fiscal-service`: esse client
 * vivia no realm `citybox-dev`, que saiu de circulação com o ADR C-16 — usá-lo
 * dava "unauthorized" (client inexistente no realm certo, achado 2026-08-14
 * testando a aba Certificado em produção). `fiscal-m2m` já era usado pela
 * `erp-api` (`FiscalApiProvider`) e já está no allowlist da fiscal-api
 * (`KEYCLOAK_ALLOWED_AZP=fiscal-m2m`); esta função passou a reusar o mesmo
 * client/secret (`KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`_SECRET` em
 * `platform-apps.env`) em vez de duplicar credencial.
 *
 * O **gate de quem pode chamar continua sendo a sessão do usuário no erp-web**
 * (`resolveAccessTokenForBff` no proxy, antes desta função ser chamada) — só a
 * chamada *de saída* para a fiscal-api passa a usar a identidade do sistema,
 * não a do usuário logado no browser. `fiscal-tenant-guard.ts` continua
 * resolvendo o `companyId` esperado pela sessão do usuário antes de repassar
 * — reusar o mesmo client que a erp-api usa não reabre o buraco cross-tenant
 * que essa checagem fecha.
 */

const CLIENT_ID_FALLBACK = "fiscal-m2m";
const FETCH_TIMEOUT_MS = 8_000;

function fiscalServiceClientId(): string {
  return process.env.KEYCLOAK_FISCAL_M2M_CLIENT_ID?.trim() || CLIENT_ID_FALLBACK;
}

function fiscalServiceClientSecret(): string {
  const secret = process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "KEYCLOAK_FISCAL_M2M_CLIENT_SECRET não configurado — necessário para autenticar o proxy fiscal servidor→servidor.",
    );
  }
  return secret;
}

let cachedToken: string | null = null;
/** Dedupe: N requests em paralelo com o cache vencido não disparam N fetches. */
let inFlight: Promise<string> | null = null;

async function fetchServiceToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: fiscalServiceClientId(),
    client_secret: fiscalServiceClientSecret(),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Issuer **público** (`keycloakIssuer()`), não `keycloakServerIssuer()`
    // (o interno, `KEYCLOAK_INTERNAL_ISSUER`, usado no resto do app pra
    // evitar hairpin de proxy): a `fiscal-api` valida o claim `iss` do token
    // contra uma lista curta de issuers aceitos (`keycloakIssuers()`,
    // `services/fiscal-api/src/shared/infra/keycloak/keycloak-jwt.ts`), e o
    // Keycloak devolve `iss` diferente dependendo do host/esquema usado pra
    // pedir o token — via `KEYCLOAK_INTERNAL_ISSUER` (`http://aplopes_keycloak
    // :8080/…`) o `iss` sai `http://auth.aplopes.com/realms/citybox-dev`, que
    // não bate com nenhum candidato da fiscal-api (401 confirmado testando
    // isso, 2026-08-13); via issuer público (`https://auth.aplopes.com/…`) o
    // `iss` bate com o candidato primário. Custo do hairpin é desprezível
    // aqui — o token fica em cache por request, não por chamada.
    const res = await fetch(
      `${keycloakIssuer()}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      throw new Error(`Keycloak client_credentials falhou (status ${res.status})`);
    }
    const data = (await res.json()) as KeycloakTokenResponse;
    if (!data.access_token) {
      throw new Error("Keycloak client_credentials sem access_token na resposta");
    }
    return data.access_token;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Access token válido para chamar a fiscal-api como o client interno
 * `fiscal-m2m`. Cacheado em memória do processo; renovado sozinho perto do
 * vencimento.
 */
export async function getFiscalServiceAccessToken(): Promise<string> {
  if (cachedToken && isAccessTokenUsable(cachedToken)) return cachedToken;
  if (inFlight) return inFlight;

  inFlight = fetchServiceToken()
    .then((token) => {
      cachedToken = token;
      return token;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

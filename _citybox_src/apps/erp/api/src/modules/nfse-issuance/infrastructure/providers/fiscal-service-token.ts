/**
 * Token de serviço (client_credentials) para chamadas **erp-api→fiscal-api**.
 *
 * A fiscal-api autoriza por *role* do Keycloak (`fiscal_operator`), não pelas
 * permissões `org.view`/`store.catalog.manage` da erp-api — repassar o token
 * do usuário final não funciona (nenhuma role do realm dá `fiscal_operator` a
 * um lojista comum).
 *
 * Cópia local — **não** um pacote compartilhado. Molde de
 * `apps/erp/web/src/lib/api/fiscal-service-token.ts` (mesmo client
 * `fiscal-m2m`, mesma lógica de cache/renovação), mas duplicado de propósito:
 * ADR C-17, Bloco 8 — "criar pacote, helper compartilhado ou symlink para
 * 'evitar repetição' [está] fora de escopo... a duplicação é intencional".
 * `@citybox/nest-common` foi removido por essa mesma razão (achado desta
 * sessão, spec erp/025, ao planejar esta tarefa antes de criar um pacote
 * novo por engano).
 *
 * `KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`_SECRET` já estão provisionados no
 * ambiente da erp-api (usados por `FiscalApiProvider` — `resolve-fiscal-
 * company`) e já estão no allowlist da fiscal-api
 * (`KEYCLOAK_ALLOWED_AZP=fiscal-m2m`). Esta função reusa a mesma credencial,
 * não uma nova.
 */

const CLIENT_ID_FALLBACK = 'fiscal-m2m';
const FETCH_TIMEOUT_MS = 8_000;
/** Mesma folga de 60s do molde do erp-web — renova antes do token realmente vencer. */
const ACCESS_SKEW_MS = 60_000;

type KeycloakTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

function fiscalIssuer(): string {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  if (!issuer) {
    throw new Error('KEYCLOAK_ISSUER não configurado');
  }
  return issuer;
}

function fiscalServiceClientId(): string {
  return (
    process.env.KEYCLOAK_FISCAL_M2M_CLIENT_ID?.trim() || CLIENT_ID_FALLBACK
  );
}

function fiscalServiceClientSecret(): string {
  const secret = process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'KEYCLOAK_FISCAL_M2M_CLIENT_SECRET não configurado — necessário para autenticar a erp-api junto à fiscal-api.',
    );
  }
  return secret;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAccessTokenUsable(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now() + ACCESS_SKEW_MS;
}

let cachedToken: string | null = null;
/** Dedupe: N chamadas concorrentes com o cache vencido não disparam N fetches. */
let inFlight: Promise<string> | null = null;

async function fetchServiceToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: fiscalServiceClientId(),
    client_secret: fiscalServiceClientSecret(),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${fiscalIssuer()}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `Keycloak client_credentials falhou (status ${res.status})`,
      );
    }
    const data = (await res.json()) as KeycloakTokenResponse;
    if (!data.access_token) {
      throw new Error(
        'Keycloak client_credentials sem access_token na resposta',
      );
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

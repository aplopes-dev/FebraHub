import { erpApiBase } from "./fiscal-tenant-guard";

const UPSTREAM_TIMEOUT_MS = 10_000;

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

/**
 * Modelo de documento fiscal do PDV da organização (spec erp/024, FR-009) —
 * usado só pelo proxy `/api/proxy/fiscal` para decidir se pode remover o CSC
 * do Emitente: enquanto o PDV estiver em Modelo 65 (NFC-e), remover o CSC
 * deixaria o caixa configurado para emitir um documento que não consegue
 * mais montar o QR Code.
 *
 * `GET /v1/pos-fiscal-settings` (não `/v1/pos/fiscal-settings` — essa é
 * `@Public()` + `DeviceAuthGuard`, autenticada pelo **terminal PDV**, não
 * pelo usuário do erp-web; inutilizável aqui, que só tem o token do usuário).
 *
 * `null` em qualquer falha de rede/parse/organização sem config — fail-open
 * de propósito (ver `plan.md` da 024): o pior caso de não bloquear é uma
 * falha de UX evitável, não uma falha de segurança — a emissão de NFC-e sem
 * CSC já é recusada por um gate próprio (`issue-nfce.use-case.ts`).
 * Bloquear TODA remoção de CSC porque a erp-api está fora do ar seria pior.
 */
export async function resolveOrgPosDocumentModel(
  userAccessToken: string,
  organizationId: string,
): Promise<"MODEL_55" | "MODEL_65" | null> {
  const data = await fetchJson(`${erpApiBase()}/v1/pos-fiscal-settings`, {
    Authorization: `Bearer ${userAccessToken}`,
    "X-Organization-Id": organizationId,
  });
  const model = (data as { data?: { posDocumentModel?: unknown } } | null)
    ?.data?.posDocumentModel;
  return model === "MODEL_55" || model === "MODEL_65" ? model : null;
}

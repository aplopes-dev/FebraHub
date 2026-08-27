"use client";

import { getActiveScope } from "@/lib/api/active-scope";

/**
 * Cliente HTTP da `services/fiscal-api`, roteado pelo proxy same-origin do
 * próprio app (`/api/proxy/fiscal/*`).
 *
 * A `fiscal-api` em si não usa headers de escopo — o isolamento dela é por
 * `companyId` explícito em cada request (ver `services/fiscal-api/AGENTS.md`,
 * FR-014). Mas o **proxy** (`app/api/proxy/fiscal/[...path]/route.ts`) precisa
 * saber de qual organização é a chamada para conferir que o `companyId`
 * pedido é mesmo o da organização ativa do usuário (2026-08-13, corrige gap
 * cross-tenant) — por isso `X-Organization-Id` viaja igual ao `apiFetch`,
 * mesmo a fiscal-api nunca vendo esse header (o proxy não repassa).
 */
const FISCAL_PROXY = "/api/proxy/fiscal";

export class FiscalApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /**
     * `error.code` do envelope da fiscal-api (`AppExceptionFilter`) — nome da
     * classe do erro de domínio, ou o código externo quando definido por
     * órgão externo. Usado por `businessErrorMessage` (BUG-05, 2026-08-13)
     * pra distinguir erro de negócio (mostrável) de erro de validação/infra
     * cru (`ValidatorDomainError`, 5xx).
     */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "FiscalApiError";
  }
}

export async function fiscalFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const { organizationId } = getActiveScope();
  if (organizationId) headers.set("X-Organization-Id", organizationId);

  const res = await fetch(`${FISCAL_PROXY}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new FiscalApiError(res.status, parsed.message, parsed.code);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Upload multipart para a fiscal-api — **não** definir `Content-Type` (o browser
 * injeta o boundary do FormData; forçar `application/json` como `fiscalFetch` faz
 * apagaria o boundary e quebraria o multipart). Espelha `apiUpload`.
 */
export async function fiscalUpload<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, "body"> = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const { organizationId } = getActiveScope();
  if (organizationId) headers.set("X-Organization-Id", organizationId);

  const res = await fetch(`${FISCAL_PROXY}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new FiscalApiError(res.status, parsed.message, parsed.code);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function extractErrorInfo(
  res: Response,
): Promise<{ message: string; code?: string }> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string; code?: string } | string;
      message?: string | string[];
    };
    if (typeof data.error === "object" && data.error?.message) {
      // Formato do AppExceptionFilter da fiscal-api: { error: { code, message } }.
      return { message: data.error.message, code: data.error.code };
    }
    if (typeof data.error === "string" && typeof data.message === "string") {
      // Formato de alguns 4xx gerados pelo próprio proxy Next.js (não pela
      // fiscal-api): { error: "code_maquina", message: "texto humano" } —
      // ex.: `csc_removal_blocked_pos_model_65` (spec erp/024, FR-009). Sem
      // este branch, `data.error` (o código) seria mostrado como mensagem.
      return { message: data.message, code: data.error };
    }
    if (typeof data.error === "string") return { message: data.error };
    // ValidationPipe do Nest devolve { message: string[] }
    if (Array.isArray(data.message)) return { message: data.message.join("; ") };
    if (typeof data.message === "string") return { message: data.message };
  } catch {
    // resposta sem corpo JSON — cai na mensagem genérica
  }
  return { message: `Erro na API fiscal (${res.status})` };
}

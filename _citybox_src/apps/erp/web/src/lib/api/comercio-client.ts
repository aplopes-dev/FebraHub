"use client";

import { fetchWithSession } from "@/lib/auth-fetch";
import { applyScopeHeaders } from "@/lib/api/active-scope";

/**
 * Cliente HTTP da `erp-comercio-api`, roteado pelo proxy same-origin do próprio
 * app (`/api/proxy/comercio/*`), que injeta o token da sessão.
 *
 * Empresa e unidade ativas viajam nos headers `X-Organization-Id` e
 * `X-Branch-Id`, injetados por `applyScopeHeaders` — nenhum service precisa
 * passar escopo como parâmetro.
 *
 * Espelha `apps/erp/src/features/food/shared/api/food-client.ts`.
 */
const COMERCIO_PROXY = "/api/proxy/comercio";

export class ComercioApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /**
     * `error.code` do envelope da erp-api (`AppExceptionFilter`) — nome da
     * classe do erro de domínio. Usado por `businessErrorMessage` (BUG-05,
     * 2026-08-13) pra distinguir erro de negócio (mostrável) de erro de
     * validação/infra cru (`ValidatorDomainError`, 5xx).
     */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ComercioApiError";
  }
}

export async function comercioFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  // Empresa/unidade ativas — obrigatórias em toda rota de negócio da API.
  applyScopeHeaders(headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // `fetchWithSession`: manda o cookie e, em 401, renova a sessão e repete uma
  // vez — o access token pode ter vencido entre a tela abrir e o clique.
  const res = await fetchWithSession(`${COMERCIO_PROXY}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new ComercioApiError(res.status, parsed.message, parsed.code);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Upload multipart — **não** definir `Content-Type` (o browser coloca o
 * boundary do FormData). Espelha `foodUpload` do ERP.
 */
export async function comercioUpload<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, "body"> = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  applyScopeHeaders(headers);

  const res = await fetchWithSession(`${COMERCIO_PROXY}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new ComercioApiError(res.status, parsed.message, parsed.code);
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
    if (typeof data.error === "string") return { message: data.error };
    if (data.error?.message) {
      return { message: data.error.message, code: data.error.code };
    }
    // ValidationPipe do Nest devolve { message: string[] }
    if (Array.isArray(data.message)) return { message: data.message.join("; ") };
    if (typeof data.message === "string") return { message: data.message };
  } catch {
    // resposta sem corpo JSON — cai na mensagem genérica
  }
  return { message: `Erro na API de comércio (${res.status})` };
}

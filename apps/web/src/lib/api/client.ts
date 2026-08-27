"use client";

import { applyScopeHeaders } from "@/lib/api/active-scope";
import { applyActorScopeHeader } from "@/features/users-permissions/lib/actor-scope-storage";

/**
 * Cliente HTTP da API, roteado pelo proxy same-origin do próprio app
 * (`/api/proxy/core/*`).
 *
 * Empresa e unidade ativas viajam nos headers `X-Organization-Id` e
 * `X-Branch-Id`, injetados por `applyScopeHeaders` — nenhum service precisa
 * passar escopo como parâmetro.
 *
 */
const API_PROXY = "/api/proxy/core";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /**
     * `error.code` do envelope da API (`AppExceptionFilter`) — nome da
     * classe do erro de domínio. Usado por `businessErrorMessage` (BUG-05,
     * 2026-08-13) pra distinguir erro de negócio (mostrável) de erro de
     * validação/infra cru (`ValidatorDomainError`, 5xx).
     */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  // Empresa/unidade ativas — obrigatórias em toda rota de negócio da API.
  applyScopeHeaders(headers);
  applyActorScopeHeader(headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_PROXY}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new ApiError(res.status, parsed.message, parsed.code);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Upload multipart — **não** definir `Content-Type` (o browser coloca o
 * boundary do FormData). Espelha `foodUpload` do ERP.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, "body"> = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  applyScopeHeaders(headers);

  const res = await fetch(`${API_PROXY}${path}`, {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const parsed = await extractErrorInfo(res);
    throw new ApiError(res.status, parsed.message, parsed.code);
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
  return { message: `Erro na API (${res.status})` };
}

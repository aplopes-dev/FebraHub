'use client';

import { toast } from 'sonner';
import { fetchWithSession } from '@/lib/auth-fetch';
import {
  promptPermissionDenied,
  resolveForbiddenClientMessage,
  shouldPromptPermissionDenied,
} from './handle-clinica-forbidden';
import { resolveClinicaErrorMessage } from './resolve-clinica-error-message';

/**
 * Cliente HTTP da vertical Clínica — roteado pelo proxy
 * (`/api/proxy/clinica/*`) que injeta autenticação e valida o acesso à loja.
 *
 * Em **403 de permissão em mutations** (POST/PUT/PATCH/DELETE): abre modal
 * global; OK recarrega a página. GET 403 não abre modal.
 */
const CLINICA_PROXY = '/api/proxy/clinica';

export class ClinicaApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Modal/toast já tratado — callers não devem notificar de novo. */
    public readonly handled: boolean = false,
  ) {
    super(message);
    this.name = 'ClinicaApiError';
  }
}

/** Mensagem para toast de mutation; `null` se já tratado (modal de permissão). */
export function clinicaMutationErrorMessage(
  error: unknown,
  fallback: string,
): string | null {
  if (error instanceof ClinicaApiError && error.handled) return null;
  if (error instanceof ClinicaApiError) return error.message;
  return fallback;
}

export function toastClinicaMutationError(
  error: unknown,
  fallback: string,
): void {
  const message = clinicaMutationErrorMessage(error, fallback);
  if (message) toast.error(message);
}

export async function clinicaFetch<T>(
  storeId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Store-Id', storeId);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (init.method ?? 'GET').toUpperCase();
  const res = await fetchWithSession(`${CLINICA_PROXY}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw await toClinicaApiError(res, method);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function clinicaUpload<T>(
  storeId: string,
  path: string,
  formData: FormData,
  init: Omit<RequestInit, 'body'> = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Store-Id', storeId);

  const method = (init.method ?? 'POST').toUpperCase();
  const res = await fetchWithSession(`${CLINICA_PROXY}${path}`, {
    ...init,
    method,
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw await toClinicaApiError(res, method);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toClinicaApiError(
  res: Response,
  method: string,
): Promise<ClinicaApiError> {
  const apiMessage = await extractApiMessage(res);
  const resolved = resolveClinicaErrorMessage(res.status, apiMessage);

  if (
    res.status === 403 &&
    shouldPromptPermissionDenied(apiMessage ?? resolved, method)
  ) {
    const message = resolveForbiddenClientMessage(apiMessage ?? resolved);
    promptPermissionDenied(message);
    return new ClinicaApiError(403, message, true);
  }

  return new ClinicaApiError(res.status, resolved);
}

async function extractApiMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string | string[];
    };
    if (typeof data.error === 'string') {
      return data.error;
    }
    if (data.error?.message) {
      return data.error.message;
    }
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  } catch {
    // resposta sem corpo JSON (ex.: nginx 413)
  }
  return undefined;
}

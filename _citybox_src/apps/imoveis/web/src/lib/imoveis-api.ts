'use client';

/**
 * Porta de entrada HTTP da imoveis-api via BFF same-origin (cookie → Bearer).
 */

import { fetchWithSession } from '@/lib/auth-fetch';
import { getActiveStoreId } from '@/lib/store-bridge';

export class ImoveisApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'ImoveisApiError';
  }
}

const IMOVELS_PROXY = '/api/proxy/imoveis';

function scopeHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('X-Store-Id', getActiveStoreId());
  return headers;
}

export async function imoveisFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = scopeHeaders(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetchWithSession(`${IMOVELS_PROXY}${path}`, { ...init, headers });

  if (!res.ok) {
    const { message, details } = await extractError(res);
    throw new ImoveisApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function imoveisUpload<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, 'body'> = {},
): Promise<T> {
  const headers = scopeHeaders(init.headers);
  headers.delete('Content-Type');

  const res = await fetchWithSession(`${IMOVELS_PROXY}${path}`, {
    ...init,
    method: init.method ?? 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const { message, details } = await extractError(res);
    throw new ImoveisApiError(res.status, message, details);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function imoveisFetchBlob(path: string): Promise<Blob> {
  const res = await fetchWithSession(`${IMOVELS_PROXY}${path}`, {
    headers: scopeHeaders(),
  });
  if (!res.ok) {
    const { message, details } = await extractError(res);
    throw new ImoveisApiError(res.status, message, details);
  }
  return res.blob();
}

async function extractError(
  res: Response,
): Promise<{ message: string; details: string[] }> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string } | string;
      message?: string | string[];
    };

    const details = Array.isArray(data.message)
      ? data.message.filter((item): item is string => typeof item === 'string')
      : [];

    if (typeof data.error === 'object' && data.error?.message) {
      return { message: data.error.message, details };
    }
    if (details.length > 0) return { message: details[0], details };
    if (typeof data.message === 'string') {
      return { message: data.message, details };
    }
    if (typeof data.error === 'string') return { message: data.error, details };
  } catch {
    // resposta sem corpo JSON
  }
  return { message: `Erro HTTP ${res.status}`, details: [] };
}

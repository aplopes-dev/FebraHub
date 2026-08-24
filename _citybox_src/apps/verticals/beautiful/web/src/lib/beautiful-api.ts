'use client';

import { fetchWithSession } from '@/lib/auth-fetch';

export class BeautifulApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'BeautifulApiError';
  }
}

const PROXY_BASE = '/api/proxy/beautiful';

let activeStoreId: string | null = null;

/** Atualizado pelo StoreProvider quando a loja ativa muda (via admin/`members/me`). */
export function setActiveStoreId(storeId: string | null) {
  activeStoreId = storeId?.trim() || null;
}

export function getActiveStoreId(): string {
  if (!activeStoreId) {
    throw new BeautifulApiError(
      400,
      'Nenhuma loja ativa. Selecione uma loja ou aguarde o carregamento.',
    );
  }
  return activeStoreId;
}

/** Base same-origin do proxy BFF (imagens/logo via `<img>` + `?storeId=`). */
export function getBeautifulApiBase(): string {
  return PROXY_BASE;
}

export async function beautifulFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body !== undefined && !headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Store-Id')) {
    headers.set('X-Store-Id', getActiveStoreId());
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const res = await fetchWithSession(`${PROXY_BASE}${normalized}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const { message, details } = await extractError(res);
    throw new BeautifulApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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
    // resposta sem JSON
  }
  return {
    message:
      'Não foi possível concluir a operação no momento. Tente novamente em instantes.',
    details: [],
  };
}

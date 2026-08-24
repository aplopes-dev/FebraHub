import 'server-only';

import { cookies } from 'next/headers';
import {
  defaultStoreId,
  imoveisApiBase,
  resolveAccessTokenForBff,
} from './auth-server';

export class ImoveisServerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ImoveisServerApiError';
  }
}

async function resolveBearer(): Promise<string> {
  const jar = await cookies();
  const accessResult = await resolveAccessTokenForBff(jar);
  if (!accessResult.access) {
    throw new ImoveisServerApiError(401, 'Sessão não autenticada');
  }
  return accessResult.access;
}

function authHeaders(token: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Store-Id', defaultStoreId());
  return headers;
}

export async function imoveisServerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await resolveBearer();
  const headers = authHeaders(token, init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${imoveisApiBase()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      const data = (await res.json()) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof data.error === 'object' && data.error?.message) message = data.error.message;
      else if (typeof data.message === 'string') message = data.message;
      else if (typeof data.error === 'string') message = data.error;
    } catch {
      // ignore
    }
    throw new ImoveisServerApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function imoveisServerFetchBlob(path: string): Promise<Blob> {
  const token = await resolveBearer();
  const res = await fetch(`${imoveisApiBase()}${path}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ImoveisServerApiError(res.status, `Erro HTTP ${res.status}`);
  }
  return res.blob();
}

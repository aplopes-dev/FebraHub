import 'server-only';

export class ImoveisPublicApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ImoveisPublicApiError';
  }
}

function apiBase(): string {
  return (
    process.env.IMOVEIS_API_URL ??
    process.env.NEXT_PUBLIC_IMOVEIS_API_URL ??
    'http://127.0.0.1:3112/api'
  ).replace(/\/$/, '');
}

export function publicStoreId(): string {
  return (
    process.env.IMOVEIS_STORE_ID ??
    process.env.NEXT_PUBLIC_IMOVEIS_STORE_ID ??
    'dev-store-imoveis'
  );
}

const PUBLIC_UPSTREAM_TIMEOUT_MS = 20_000;

function asPublicFetchError(error: unknown): ImoveisPublicApiError {
  if (error instanceof ImoveisPublicApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ImoveisPublicApiError(504, 'Tempo esgotado');
  }
  return new ImoveisPublicApiError(502, 'Link indisponível');
}

export async function imoveisPublicFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(PUBLIC_UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      let message = `Erro HTTP ${res.status}`;
      try {
        const data = (await res.json()) as {
          error?: { message?: string } | string;
          message?: string;
        };
        if (typeof data.error === 'object' && data.error?.message) {
          message = data.error.message;
        } else if (typeof data.message === 'string') {
          message = data.message;
        } else if (typeof data.error === 'string') {
          message = data.error;
        }
      } catch {
        // ignore
      }
      throw new ImoveisPublicApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    try {
      return (text ? JSON.parse(text) : undefined) as T;
    } catch {
      throw new ImoveisPublicApiError(502, 'Resposta inválida');
    }
  } catch (error) {
    throw asPublicFetchError(error);
  }
}

export async function imoveisPublicFetchBlob(path: string): Promise<Blob> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(PUBLIC_UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new ImoveisPublicApiError(res.status, `Erro HTTP ${res.status}`);
    }
    return res.blob();
  } catch (error) {
    throw asPublicFetchError(error);
  }
}

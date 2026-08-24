/**
 * Cache de object URLs para paths autenticados da imoveis-api (`/v1/…`).
 * Evita re-download + recreate de blob a cada remount (fotogaleria, cards, refresh).
 */

import { imoveisFetchBlob } from '@/lib/imoveis-api';

type CacheEntry = {
  url: string;
  /** ms epoch da criação — para limpeza opcional */
  createdAt: number;
};

const MAX_ENTRIES = 96;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string>>();

function touch(key: string, entry: CacheEntry): string {
  // LRU: reinserir no fim
  cache.delete(key);
  cache.set(key, entry);
  return entry.url;
}

function evictIfNeeded() {
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    const entry = cache.get(oldest);
    cache.delete(oldest);
    if (entry?.url.startsWith('blob:')) {
      URL.revokeObjectURL(entry.url);
    }
  }
}

export function authBlobCacheKey(path: string, revision?: number): string {
  return revision !== undefined ? `${path}::${revision}` : path;
}

/**
 * Resolve path `/v1/…` em object URL cacheado.
 * Reuso seguro entre componentes — não revogue a URL no unmount do consumidor.
 */
export async function resolveAuthBlobUrl(
  path: string,
  revision?: number,
): Promise<string> {
  const key = authBlobCacheKey(path, revision);
  const hit = cache.get(key);
  if (hit?.url) return touch(key, hit);

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const blob = await imoveisFetchBlob(path);
    const url = URL.createObjectURL(blob);
    const entry = { url, createdAt: Date.now() };
    cache.set(key, entry);
    evictIfNeeded();
    return url;
  })()
    .catch((error) => {
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Invalida entrada (ex.: reupload de foto de perfil). */
export function invalidateAuthBlobUrl(path: string, revision?: number): void {
  if (revision !== undefined) {
    const key = authBlobCacheKey(path, revision);
    const entry = cache.get(key);
    if (entry) {
      cache.delete(key);
      if (entry.url.startsWith('blob:')) URL.revokeObjectURL(entry.url);
    }
    return;
  }
  // Sem revision: remove todas as variantes do path
  for (const key of [...cache.keys()]) {
    if (key === path || key.startsWith(`${path}::`)) {
      const entry = cache.get(key);
      cache.delete(key);
      if (entry?.url.startsWith('blob:')) URL.revokeObjectURL(entry.url);
    }
  }
}

export function peekAuthBlobUrl(
  path: string,
  revision?: number,
): string | undefined {
  return cache.get(authBlobCacheKey(path, revision))?.url;
}

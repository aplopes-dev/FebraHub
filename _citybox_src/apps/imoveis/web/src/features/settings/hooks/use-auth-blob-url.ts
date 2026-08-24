'use client';

import { useEffect, useState } from 'react';
import {
  peekAuthBlobUrl,
  resolveAuthBlobUrl,
} from '@/lib/auth-blob-cache';

/**
 * Resolve um path autenticado da API (`/v1/…`) em object URL.
 * `blob:`/`data:`/URL absoluta passam direto — só o path relativo precisa de Bearer.
 *
 * Cache síncrono no render: troca de foto com hit no cache é imediata
 * (sem `setUrl(undefined)` no meio do caminho).
 *
 * `revision` invalida o cache quando o path não muda (ex.: foto de perfil em
 * `/v1/settings/profile/:id/photo` após reupload).
 */
export function useAuthBlobUrl(
  src?: string | null,
  revision?: number,
): string | undefined {
  const needsAuth = Boolean(src && src.startsWith('/v1/'));
  const remoteSrc = needsAuth ? (src as string) : undefined;

  /** Só para forçar re-render quando o download termina. */
  const [, setEpoch] = useState(0);

  useEffect(() => {
    if (!remoteSrc) return;

    if (peekAuthBlobUrl(remoteSrc, revision)) return;

    let cancelled = false;
    void resolveAuthBlobUrl(remoteSrc, revision)
      .then(() => {
        if (!cancelled) setEpoch((n) => n + 1);
      })
      .catch(() => {
        // peek continua vazio — UI mostra placeholder
      });

    return () => {
      cancelled = true;
    };
  }, [remoteSrc, revision]);

  if (!needsAuth) return src ?? undefined;
  if (!remoteSrc) return undefined;
  return peekAuthBlobUrl(remoteSrc, revision);
}

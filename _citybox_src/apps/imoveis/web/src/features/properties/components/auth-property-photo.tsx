'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  peekAuthBlobUrl,
  resolveAuthBlobUrl,
} from '@/lib/auth-blob-cache';

type AuthPropertyPhotoProps = {
  /** Path relativo (`/v1/properties/.../photos/...`), `blob:` ou `data:`. */
  src?: string | null;
  alt: string;
  className?: string;
};

function isLocalPreview(src: string): boolean {
  return src.startsWith('blob:') || src.startsWith('data:');
}

/**
 * `<img>` autenticado: paths da API precisam de Bearer — busca blob e cria object URL.
 * Cache síncrono no render (troca/remount com hit instantâneo).
 */
export function AuthPropertyPhoto({
  src,
  alt,
  className,
}: AuthPropertyPhotoProps) {
  const localSrc = src && isLocalPreview(src) ? src : null;
  const remoteSrc = src && !localSrc ? src : undefined;

  /** Força re-render quando o download termina. */
  const [, setEpoch] = useState(0);

  useEffect(() => {
    if (!remoteSrc) return;
    if (peekAuthBlobUrl(remoteSrc)) return;

    let cancelled = false;
    void resolveAuthBlobUrl(remoteSrc)
      .then(() => {
        if (!cancelled) setEpoch((n) => n + 1);
      })
      .catch(() => {
        // placeholder permanece
      });

    return () => {
      cancelled = true;
    };
  }, [remoteSrc]);

  const resolved =
    localSrc ?? (remoteSrc ? peekAuthBlobUrl(remoteSrc) : undefined) ?? null;

  if (!resolved) {
    return <div className={cn('size-full bg-muted/40', className)} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob/auth URL
    <img
      src={resolved}
      alt={alt}
      className={cn(
        'block size-full max-h-full max-w-full object-cover',
        className,
      )}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      loading="lazy"
      decoding="async"
    />
  );
}

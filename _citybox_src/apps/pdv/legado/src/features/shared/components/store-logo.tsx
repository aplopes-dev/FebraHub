'use client';

import { cn } from '@citybox/ui';
import Image from 'next/image';
import type { StoreSummary } from '../types/store';

type StoreLogoProps = {
  store: StoreSummary;
  className?: string;
};

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

/**
 * Logo da loja/restaurante no header do PDV.
 * Usa imagem quando houver `logoUrl`; caso contrário monograma.
 */
export function StoreLogo({ store, className }: StoreLogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span aria-hidden>{monogram(store.name)}</span>
        )}
      </div>
      <span className="truncate text-base font-semibold tracking-tight">
        {store.name}
      </span>
    </div>
  );
}

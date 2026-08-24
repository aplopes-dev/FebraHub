'use client';

import { useEffect, useRef } from 'react';
import { scrollListToTop } from '@/lib/scroll';

/**
 * Ao mudar `page` (não no primeiro render), rola para o topo da lista.
 * Preferir `ListifyPagination` — o scroll já está embutido lá.
 */
export function useScrollListToTopOnPageChange(
  page: number,
  listRef?: { readonly current: HTMLElement | null },
): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollListToTop(listRef?.current ?? null);
  }, [page, listRef]);
}

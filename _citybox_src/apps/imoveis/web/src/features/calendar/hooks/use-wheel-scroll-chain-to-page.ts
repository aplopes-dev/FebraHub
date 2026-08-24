'use client';

import { useEffect, type RefObject } from 'react';
import { PAGE_SCROLL_SELECTOR } from '@/lib/scroll';

/**
 * Quando o mouse está sobre um scroller interno da agenda, o wheel fica “preso”
 * nele (e com `overscroll-behavior: contain` não chega à casca).
 * Encadeia para `.imoveis-page-scroll` se o interno não rola ou já está no topo/fundo.
 */
export function useWheelScrollChainToPage(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0 || event.ctrlKey) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const hasOverflow = maxScroll > 1;
      const atTop = scrollTop <= 0.5;
      const atBottom = scrollTop >= maxScroll - 0.5;
      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;

      const shouldChain =
        !hasOverflow ||
        (scrollingUp && atTop) ||
        (scrollingDown && atBottom);

      if (!shouldChain) return;

      const page = document.querySelector<HTMLElement>(PAGE_SCROLL_SELECTOR);
      if (!page) return;

      const pageMax = page.scrollHeight - page.clientHeight;
      if (pageMax <= 1) return;

      if (scrollingDown && page.scrollTop >= pageMax - 0.5) return;
      if (scrollingUp && page.scrollTop <= 0.5) return;

      page.scrollTop += event.deltaY;
      event.preventDefault();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enabled, ref]);
}

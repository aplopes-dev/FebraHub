'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readHorizontalScrollOverflow,
  type HorizontalScrollOverflow,
} from '../utils/horizontal-scroll-overflow';

const EMPTY_OVERFLOW: HorizontalScrollOverflow = {
  canScrollStart: false,
  canScrollEnd: false,
};

/**
 * Observa um scroller horizontal e diz se ainda há itens escondidos nas bordas.
 */
export function useHorizontalScrollOverflow(
  scrollerRef: { readonly current: HTMLElement | null },
  extraKey = '',
): HorizontalScrollOverflow & {
  scrollMore: (direction: -1 | 1) => void;
} {
  const [overflow, setOverflow] =
    useState<HorizontalScrollOverflow>(EMPTY_OVERFLOW);

  const update = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) {
      setOverflow(EMPTY_OVERFLOW);
      return;
    }
    setOverflow(readHorizontalScrollOverflow(element));
  }, [scrollerRef]);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return undefined;

    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }

    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update, extraKey]);

  const scrollMore = useCallback(
    (direction: -1 | 1) => {
      const element = scrollerRef.current;
      if (!element) return;
      const delta = Math.max(element.clientWidth * 0.55, 96) * direction;
      element.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [scrollerRef],
  );

  return { ...overflow, scrollMore };
}

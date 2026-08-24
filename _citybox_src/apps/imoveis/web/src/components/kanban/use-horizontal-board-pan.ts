'use client';

import { useLayoutEffect } from 'react';

/** Deslocamento mínimo antes de travar eixo (px). */
const LOCK_PX = 6;
/** Gesto mais horizontal que vertical. */
const AXIS_RATIO = 1.1;

type AxisLock = 'undecided' | 'horizontal' | 'vertical';

/**
 * Alça de drag do dnd-kit — não inicia pan do board (prioridade ao reordenar).
 * Cards em si permitem pan horizontal (gesto de “próxima coluna” no mobile).
 */
function isDragHandleTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('.kanban-card-handle, [data-kanban-drag-handle]'),
  );
}

function findVerticalScroller(
  start: EventTarget | null,
  stopAt: HTMLElement,
): HTMLElement | null {
  let node: Element | null = start instanceof Element ? start : null;
  while (node && node !== stopAt) {
    if (node instanceof HTMLElement) {
      const { overflowY } = getComputedStyle(node);
      const canScrollY =
        (overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflowY === 'overlay') &&
        node.scrollHeight > node.clientHeight + 1;
      if (canScrollY) return node;
    }
    node = node.parentElement;
  }
  return null;
}

function clientPoint(
  event: TouchEvent | PointerEvent,
): { x: number; y: number } | null {
  if ('touches' in event) {
    const t = event.touches[0] ?? event.changedTouches[0];
    if (!t) return null;
    return { x: t.clientX, y: t.clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

/**
 * Pan horizontal do kanban no mobile (gesto de galeria / carrossel).
 *
 * - Touch* (primário) + Pointer (DevTools mouse / pen) **só após lock de eixo**
 * - Nunca captura pointer no `pointerdown`: `setPointerCapture` rouba o clique
 *   dos cards (onClick do Kanban não dispara).
 * - `touchmove` non-passive + capture + preventDefault no eixo horizontal
 * - Vertical: scroller de coluna (`data-kanban-column-scroll`) → pan vertical interno;
 *   sem scroller → libera gesto para o scroll da página (`main`)
 * - Clique vs pan: movimento pequeno não cancela onClick dos cards.
 */
export function useHorizontalBoardPan(
  scroller: HTMLElement | null,
  options?: {
    enabled?: boolean;
    isBlocked?: () => boolean;
  },
): void {
  const enabled = options?.enabled !== false;
  const isBlocked = options?.isBlocked;

  useLayoutEffect(() => {
    if (!enabled || !scroller) return;
    const el = scroller;

    let active = false;
    let axis: AxisLock = 'undecided';
    let startX = 0;
    let startY = 0;
    let originScrollLeft = 0;
    let originScrollTop = 0;
    let verticalTarget: HTMLElement | null = null;
    let pointerId: number | null = null;

    const releaseCapture = (id: number | null) => {
      if (id == null) return;
      if (!el.hasPointerCapture(id)) return;
      try {
        el.releasePointerCapture(id);
      } catch {
        // ignore
      }
    };

    const ensureCapture = (event: PointerEvent) => {
      if (el.hasPointerCapture(event.pointerId)) return;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    };

    const reset = () => {
      releaseCapture(pointerId);
      active = false;
      axis = 'undecided';
      verticalTarget = null;
      pointerId = null;
      el.style.scrollSnapType = '';
    };

    const begin = (
      event: TouchEvent | PointerEvent,
      target: EventTarget | null,
    ): boolean => {
      if (isBlocked?.()) return false;
      if (isDragHandleTarget(target)) return false;

      if ('pointerType' in event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return false;
      }

      const point = clientPoint(event);
      if (!point) return false;

      active = true;
      axis = 'undecided';
      startX = point.x;
      startY = point.y;
      originScrollLeft = el.scrollLeft;
      verticalTarget = findVerticalScroller(target, el);
      originScrollTop = verticalTarget?.scrollTop ?? 0;

      if ('pointerId' in event) {
        pointerId = event.pointerId;
      }
      return true;
    };

    const move = (event: TouchEvent | PointerEvent) => {
      if (!active) return;
      if (isBlocked?.()) {
        reset();
        return;
      }

      if (
        'pointerId' in event &&
        pointerId != null &&
        event.pointerId !== pointerId
      ) {
        return;
      }

      const point = clientPoint(event);
      if (!point) return;

      const dx = point.x - startX;
      const dy = point.y - startY;

      if (axis === 'undecided') {
        if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;

        if (Math.abs(dx) >= Math.abs(dy) * AXIS_RATIO) {
          axis = 'horizontal';
          el.style.scrollSnapType = 'none';
        } else if (verticalTarget) {
          axis = 'vertical';
        } else {
          // Sem scroller de coluna: deixa o scroll da página (vertical nativo).
          reset();
          return;
        }

        // Só captura depois do lock — clique (sem arraste) continua no card.
        if ('pointerId' in event) {
          ensureCapture(event);
        }
      }

      if (axis === 'horizontal') {
        if (event.cancelable) event.preventDefault();
        el.scrollLeft = originScrollLeft - dx;
        return;
      }

      if (axis === 'vertical' && verticalTarget) {
        if (event.cancelable) event.preventDefault();
        verticalTarget.scrollTop = originScrollTop - dy;
      }
    };

    const end = (event?: TouchEvent | PointerEvent) => {
      if (!active) return;
      if (
        event &&
        'pointerId' in event &&
        pointerId != null &&
        event.pointerId !== pointerId
      ) {
        return;
      }
      reset();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      begin(event, event.target);
    };
    const onTouchMove = (event: TouchEvent) => {
      move(event);
    };
    const onTouchEnd = () => {
      end();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      begin(event, event.target);
      // Sem setPointerCapture aqui — senão o scroller engole click/onClick do card.
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      move(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      end(event);
    };

    el.addEventListener('touchstart', onTouchStart, {
      passive: true,
      capture: true,
    });
    el.addEventListener('touchmove', onTouchMove, {
      passive: false,
      capture: true,
    });
    el.addEventListener('touchend', onTouchEnd, { capture: true });
    el.addEventListener('touchcancel', onTouchEnd, { capture: true });
    el.addEventListener('pointerdown', onPointerDown, { capture: true });
    el.addEventListener('pointermove', onPointerMove, {
      passive: false,
      capture: true,
    });
    el.addEventListener('pointerup', onPointerUp, { capture: true });
    el.addEventListener('pointercancel', onPointerUp, { capture: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart, true);
      el.removeEventListener('touchmove', onTouchMove, true);
      el.removeEventListener('touchend', onTouchEnd, true);
      el.removeEventListener('touchcancel', onTouchEnd, true);
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('pointermove', onPointerMove, true);
      el.removeEventListener('pointerup', onPointerUp, true);
      el.removeEventListener('pointercancel', onPointerUp, true);
      reset();
    };
  }, [enabled, isBlocked, scroller]);
}

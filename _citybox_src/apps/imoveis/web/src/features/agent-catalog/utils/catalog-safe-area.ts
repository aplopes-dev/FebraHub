/**
 * Utilitários de safe-area só para o catálogo público (viewport-fit=cover no layout).
 * Usar classes Tailwind; desktop (md+) não aplica sticky que dependa disto.
 */

/** Padding inferior da sticky bar (home indicator). */
export const catalogStickySafeAreaClassName =
  'px-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]';

/** Reserva espaço no main para sticky WA + safe-area (só mobile). */
export const catalogDetailMainWithStickyClassName =
  'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10';

/** Top bar do header: não colar nas edges de notch. */
export const catalogHeaderBarSafeClassName =
  'px-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]';

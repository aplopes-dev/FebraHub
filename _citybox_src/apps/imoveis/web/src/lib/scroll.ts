/**
 * Padrão de scroll do Imóveis (§4.2 AGENTS.md).
 *
 * - Página do painel: `PAGE_SCROLL_CLASS` no `<main>` da `DashboardShell`
 *   (barra na **borda da viewport**, única rolagem vertical de página).
 * - Modais / pickers / listas horizontais: `SCROLL_CLASS` + overflow próprio.
 * - Exceção: colunas do kanban (`data-kanban-column-scroll`) — scroll vertical
 *   interno com teto de altura + “Ver mais” por coluna.
 * - Troca de página em listas: `ListifyPagination` (scroll ao topo embutido).
 */
export const SCROLL_CLASS = 'imoveis-scroll';

/** Classe do `<main>` da casca — usar no `querySelector`, não a string composta. */
export const PAGE_SCROLL_SELECTOR = '.imoveis-page-scroll';

/** Scroll da casca — full-bleed na viewport + track Listify. */
export const PAGE_SCROLL_CLASS = 'imoveis-scroll imoveis-page-scroll';

type RectBox = {
  getBoundingClientRect: () => { top: number };
};

type ScrollBox = RectBox & {
  scrollTop: number;
};

/**
 * Topo do scroller para alinhar `target` ao início da área visível.
 * Extraído para teste sem DOM de página.
 */
export function nextScrollTopToAlign(scroller: ScrollBox, target: RectBox): number {
  const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  return Math.max(0, scroller.scrollTop + offset);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export function getPageScrollRoot(
  doc: Pick<Document, 'querySelector'> | null = typeof document === 'undefined' ? null : document,
): HTMLElement | null {
  return doc?.querySelector<HTMLElement>(PAGE_SCROLL_SELECTOR) ?? null;
}

function isVerticallyScrollable(el: HTMLElement): boolean {
  if (typeof window === 'undefined') return false;
  const { overflowY } = window.getComputedStyle(el);
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return el.scrollHeight > el.clientHeight + 1;
}

/** Scroller da lista: ancestral com overflow, senão a casca da página. */
export function findListScrollRoot(from?: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = from ?? null;
  while (node) {
    if (isVerticallyScrollable(node)) return node;
    node = node.parentElement;
  }
  return getPageScrollRoot();
}

/**
 * Volta ao topo da lista/página ao mudar de página.
 * Com `listEl`, alinha no scroller mais próximo (página, modal ou drawer).
 * Sem `listEl`: painel → `.imoveis-page-scroll`; catálogo público → `window`.
 */
export function scrollListToTop(listEl?: HTMLElement | null): void {
  const behavior = scrollBehavior();
  const scroller = listEl ? findListScrollRoot(listEl) : getPageScrollRoot();

  if (scroller) {
    const top =
      listEl && scroller !== listEl ? nextScrollTopToAlign(scroller, listEl) : 0;
    scroller.scrollTo({ top, behavior });
    return;
  }

  if (listEl) {
    listEl.scrollIntoView({ block: 'start', behavior });
    return;
  }

  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior });
  }
}

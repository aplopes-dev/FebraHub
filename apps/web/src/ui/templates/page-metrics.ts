/**
 * Medidas da página de conteúdo.
 *
 * Vêm do `main-layout.component.ts` do front Angular. O `DualDashboardLayout`
 * deixa o conteúdo ocupar a largura toda; daqui sobra o espaçamento em volta.
 */

/** `.shell__page` — 20px (spacing 2.5). */
export const PAGE_PADDING = 2.5;

/** Padding do `main` por breakpoint — 16px no mobile, 20px a partir de `sm`. */
export const pagePaddingSx = {
  p: { xs: 2, sm: PAGE_PADDING },
} as const;

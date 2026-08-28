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

/** Padding do `main` no mobile — 16px (spacing 2). */
export const PAGE_PADDING_MOBILE = 2;

/**
 * Cancela o padding do `<main>` para o conteúdo ir de ponta a ponta.
 *
 * Usado por quem tem rolagem própria (`Page`): a barra de rolagem precisa
 * encostar na borda do container, não flutuar 20px para dentro. O padding
 * volta por dentro da área rolável, então o texto continua no lugar certo — só
 * a barra é que ganha a borda.
 *
 * Os valores são fixos em px porque `sx` não aceita função dentro de objeto
 * responsivo: 2 × 16px no mobile, 2 × 20px a partir de `sm`.
 */
export const pageBleedSx = {
  mx: { xs: -PAGE_PADDING_MOBILE, sm: -PAGE_PADDING },
  mt: { xs: -PAGE_PADDING_MOBILE, sm: -PAGE_PADDING },
  mb: { xs: -PAGE_PADDING_MOBILE, sm: -PAGE_PADDING },
  width: { xs: "calc(100% + 32px)", sm: "calc(100% + 40px)" },
  maxWidth: { xs: "calc(100% + 32px)", sm: "calc(100% + 40px)" },
} as const;

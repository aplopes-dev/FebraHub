/**
 * Painel flutuante do Sheet — personalização só da vertical clinic.
 * Não alterar `packages/ui`; sobrescrever via className no SheetContent.
 *
 * O Sheet padrão fixa `data-[side=right]:sm:max-w-sm` (384px) — usar o mesmo
 * seletor com variante `data-[side=right]:` para a largura customizada valer.
 *
 * Larguras grandes usam `min(Nrem, calc(100%-2rem))` para não estourar a
 * viewport no tablet (768×1024) com `right-4`.
 */
export const CLINIC_FLOATING_SHEET_CONTENT_CLASS =
  'overflow-hidden rounded-2xl border border-border/60 shadow-xl data-[side=right]:top-4 data-[side=right]:right-4 data-[side=right]:bottom-4 data-[side=right]:left-auto data-[side=right]:h-auto data-[side=right]:max-h-[calc(100dvh-2rem)] data-[side=right]:w-full data-[side=right]:max-w-[calc(100%-2rem)] data-[side=right]:sm:max-w-[min(64rem,calc(100%-2rem))] data-[side=right]:border-l';

/** Overlay leve sobre o sheet pai — mantém o conteúdo legível por baixo. */
export const CLINIC_NESTED_SHEET_BACKDROP_CLASS = 'fixed inset-0 z-[55] bg-black/20';

/** Sheet aninhado — sobre o sheet principal, com largura intermediária. */
export const CLINIC_NESTED_SHEET_CONTENT_CLASS =
  'z-[60] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl data-[side=right]:top-4 data-[side=right]:right-4 data-[side=right]:bottom-4 data-[side=right]:left-auto data-[side=right]:h-auto data-[side=right]:max-h-[calc(100dvh-2rem)] data-[side=right]:w-full data-[side=right]:max-w-[calc(100%-2rem)] data-[side=right]:sm:max-w-[min(42rem,calc(100%-2rem))] data-[side=right]:border-l';

/** Conteúdo de popover/select acima do sheet aninhado. */
export const CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS = 'z-[70]';

/** Marca o sheet filho como aninhado — pareado com regra em clinic-sheets.css */
export const CLINIC_NESTED_SHEET_CONTENT_PROPS = {
  'data-clinic-nested-sheet': true,
} as const;

/** Sheet estreito — formulários simples (ex.: novo plano). */
export const CLINIC_NARROW_SHEET_CONTENT_CLASS =
  'overflow-hidden rounded-2xl border border-border/60 shadow-xl data-[side=right]:top-4 data-[side=right]:right-4 data-[side=right]:bottom-4 data-[side=right]:left-auto data-[side=right]:h-auto data-[side=right]:max-h-[calc(100dvh-2rem)] data-[side=right]:w-full data-[side=right]:max-w-[calc(100%-2rem)] data-[side=right]:sm:max-w-[min(36rem,calc(100%-2rem))] data-[side=right]:border-l';

/** Rodapé fixo dos sheets da vertical clinic — botões maiores e mais espaçados. */
export const CLINIC_SHEET_FOOTER_CLASS =
  'shrink-0 flex-row justify-end gap-3 border-t border-border/50 px-6 py-5';

/** Cabeçalho fixo dos sheets da vertical clinic — título + divisor inferior. */
export const CLINIC_SHEET_HEADER_CLASS =
  'shrink-0 border-b border-border/50 px-6 py-5';

/** Padding interno padrão do corpo rolável dos sheets da vertical clinic. */
export const CLINIC_SHEET_BODY_PADDING_CLASS = 'px-6 py-5';

/** Corpo rolável entre header e footer — usar com sheet em coluna e altura limitada à viewport. */
export const CLINIC_SHEET_SCROLL_BODY_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain';

/** Layout flex em coluna com altura limitada à viewport (header + scroll + footer). */
export const CLINIC_FLOATING_SHEET_LAYOUT_CLASS =
  'flex flex-col gap-0 p-0 data-[side=right]:h-[calc(100dvh-2rem)] data-[side=right]:max-h-[calc(100dvh-2rem)]';

/** Botões do rodapé dos sheets da vertical clinic. */
export const CLINIC_SHEET_FOOTER_BUTTON_CLASS = 'h-11 min-w-[8.5rem] px-6 text-base';

/** Sheet em tela cheia — sobe de baixo para cima (ex.: editor de contrato). */
export const CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS =
  'inset-x-0 bottom-0 h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none border-0 shadow-none data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:top-0 data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-[100dvh] data-[side=bottom]:w-full data-[side=bottom]:border-t-0';

/** Marca o sheet fullscreen bottom — pareado com animação em clinic-sheets.css */
export const CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS = {
  'data-clinic-fullscreen-bottom-sheet': true,
} as const;

/** Sheet em tela cheia — expande da direita para a esquerda (ex.: evolução expandida). */
export const CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_CLASS =
  'inset-y-0 right-0 h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none border-0 shadow-none data-[side=right]:inset-y-0 data-[side=right]:left-0 data-[side=right]:right-0 data-[side=right]:h-[100dvh] data-[side=right]:max-h-[100dvh] data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-none data-[side=right]:border-l-0';

/** Marca o sheet fullscreen right — pareado com animação em clinic-sheets.css */
export const CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_PROPS = {
  'data-clinic-fullscreen-right-sheet': true,
} as const;

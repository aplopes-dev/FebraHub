/**
 * Estilos canônicos do DataTable (@citybox/ui) no ERP.
 * Referência: product-list-table — bordas suaves, cabeçalho muted, títulos alinhados ao conteúdo.
 *
 * Política: sem scroll horizontal — `table-fixed`, células com `max-w-0` + `truncate` no conteúdo.
 */

export const ERP_DATA_TABLE_ROOT_CLASS =
  'min-w-0 max-w-full [&>div:first-child]:overflow-hidden [&>div:first-child]:rounded-xl [&>div:first-child]:border [&>div:first-child]:border-border/60';

/** Cabeçalho visível da coluna ⋯ (última coluna, alinhado à direita). */
export const ERP_DATA_TABLE_ACTIONS_HEADER_CLASS =
  'block w-full text-right font-medium';

/** Largura mínima da última coluna — evita cortar o botão ⋯. */
const ERP_DATA_TABLE_ACTIONS_COLUMN_CLASS =
  '[&_th:last-child]:w-auto [&_th:last-child]:min-w-14 [&_th:last-child]:max-w-none [&_th:last-child]:overflow-visible [&_td:last-child]:w-auto [&_td:last-child]:min-w-14 [&_td:last-child]:max-w-none [&_td:last-child]:overflow-visible [&_th:last-child]:whitespace-nowrap [&_td:last-child]:whitespace-nowrap [&_th:last-child]:pl-1 [&_th:last-child]:pr-1.5 [&_th:last-child]:text-right [&_td:last-child]:pl-1 [&_td:last-child]:pr-1.5 [&_td:last-child]:text-right';

const ERP_DATA_TABLE_COMPACT_PADDING_CLASS = '[&_th]:px-2 [&_td]:px-2';

const ERP_DATA_TABLE_LAYOUT_TAIL_CLASS = `${ERP_DATA_TABLE_ACTIONS_COLUMN_CLASS} ${ERP_DATA_TABLE_COMPACT_PADDING_CLASS}`;

const ERP_DATA_TABLE_BASE_HEADER_CLASS =
  'bg-muted/40 [&_tr]:border-b [&_tr]:border-border/60 [&_th]:max-w-0 [&_th]:overflow-hidden [&_th]:border-0 [&_th]:text-left [&_th]:text-foreground';

const ERP_DATA_TABLE_BASE_BODY_CLASS =
  'w-full table-fixed border-collapse [&_td]:max-w-0 [&_td]:overflow-hidden [&_td]:border-0 [&_td]:text-left [&_td]:align-middle [&_tr]:border-0 [&_tbody_tr]:border-0';

/** Use só quando a penúltima coluna for Status (financeiro) — não usar em Curva ABC (Ação sugerida). */
export const ERP_DATA_TABLE_STATUS_BEFORE_ACTIONS_CLASS =
  '[&_th:nth-last-child(2)]:w-[1%] [&_td:nth-last-child(2)]:w-[1%] [&_th:nth-last-child(2)]:max-w-[8.5rem] [&_td:nth-last-child(2)]:max-w-[8.5rem] [&_th:nth-last-child(2)]:overflow-visible [&_td:nth-last-child(2)]:overflow-visible [&_th:nth-last-child(2)]:whitespace-nowrap [&_td:nth-last-child(2)]:whitespace-nowrap [&_th:nth-last-child(2)]:pr-1 [&_td:nth-last-child(2)]:pr-1 [&_th:nth-last-child(2)]:text-right [&_td:nth-last-child(2)]:text-right';

export const ERP_DATA_TABLE_HEADER_CLASS =
  `${ERP_DATA_TABLE_BASE_HEADER_CLASS} ${ERP_DATA_TABLE_LAYOUT_TAIL_CLASS}`;

export const ERP_DATA_TABLE_BODY_CLASS =
  `${ERP_DATA_TABLE_BASE_BODY_CLASS} ${ERP_DATA_TABLE_LAYOUT_TAIL_CLASS}`;

/** Sem coluna ⋯ — última coluna é dado (ex.: Data), alinhada à esquerda como as demais. */
export const ERP_DATA_TABLE_HEADER_NO_ACTIONS_CLASS =
  `${ERP_DATA_TABLE_BASE_HEADER_CLASS} ${ERP_DATA_TABLE_COMPACT_PADDING_CLASS}`;

export const ERP_DATA_TABLE_BODY_NO_ACTIONS_CLASS =
  `${ERP_DATA_TABLE_BASE_BODY_CLASS} ${ERP_DATA_TABLE_COMPACT_PADDING_CLASS}`;

/** Wrapper opcional para células de menu ⋯ (última coluna). */
export const ERP_DATA_TABLE_ACTIONS_CELL_CLASS = 'flex w-full justify-end';

/** Tabela só no desktop (mobile usa card list no consumidor). Sem scroll horizontal. */
export const ERP_DATA_TABLE_RESPONSIVE_SCROLL_CLASS =
  'hidden min-w-0 max-w-full lg:block [&>div:first-child]:overflow-hidden [&>div:first-child]:rounded-xl [&>div:first-child]:border [&>div:first-child]:border-border/60';

export const erpDataTableStyleProps = {
  className: ERP_DATA_TABLE_ROOT_CLASS,
  tableClassName: ERP_DATA_TABLE_BODY_CLASS,
  headerClassName: ERP_DATA_TABLE_HEADER_CLASS,
} as const;

/** Tabelas sem coluna de ações — evita `text-right` na última coluna de dados. */
export const erpDataTableNoActionsStyleProps = {
  className: ERP_DATA_TABLE_ROOT_CLASS,
  tableClassName: ERP_DATA_TABLE_BODY_NO_ACTIONS_CLASS,
  headerClassName: ERP_DATA_TABLE_HEADER_NO_ACTIONS_CLASS,
} as const;

/** Listagens financeiras: penúltima coluna = Status (compacta junto de Ações). */
export const erpFinanceStatusTableStyleProps = {
  className: ERP_DATA_TABLE_ROOT_CLASS,
  tableClassName: `${ERP_DATA_TABLE_BODY_CLASS} ${ERP_DATA_TABLE_STATUS_BEFORE_ACTIONS_CLASS}`,
  headerClassName: `${ERP_DATA_TABLE_HEADER_CLASS} ${ERP_DATA_TABLE_STATUS_BEFORE_ACTIONS_CLASS}`,
} as const;

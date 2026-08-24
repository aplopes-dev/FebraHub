/**
 * DataTable dos Relatórios: scroll horizontal em tablet (ex.: 768×1024)
 * para não cortar títulos de coluna. Diferente da política ERP sem scroll
 * (`erpDataTableNoActionsStyleProps` + `table-fixed`).
 *
 * O scroll fica só no wrapper da tabela — nunca na paginação — para o
 * botão “próxima página” não competir com a barra de scroll.
 */

export const REPORTS_DATA_TABLE_SCROLL_CLASS =
  'min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]';

export const REPORTS_DATA_TABLE_ZEBRA_CLASS =
  '[&_tbody_tr:nth-child(even)]:bg-muted';

export const reportsDataTableStyleProps = {
  className: 'min-w-0 max-w-full',
  tableWrapperClassName: `${REPORTS_DATA_TABLE_SCROLL_CLASS} rounded-xl border border-border/60`,
  tableClassName: `w-full min-w-max table-auto border-collapse [&_td]:whitespace-nowrap [&_td]:border-0 [&_td]:px-2 [&_td]:text-left [&_td]:align-middle [&_tr]:border-0 [&_tbody_tr]:border-0 ${REPORTS_DATA_TABLE_ZEBRA_CLASS}`,
  headerClassName:
    'bg-muted/40 [&_tr]:border-b [&_tr]:border-border/60 [&_th]:whitespace-nowrap [&_th]:border-0 [&_th]:px-2 [&_th]:text-left [&_th]:text-foreground',
} as const;

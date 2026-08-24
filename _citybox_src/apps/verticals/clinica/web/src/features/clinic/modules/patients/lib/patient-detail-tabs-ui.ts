/** Cancela o padding do main do shell ERP na ficha do paciente. */
export const PATIENT_DETAIL_LAYOUT_ROOT_CLASS = '-m-4 flex min-h-full flex-col';

/** Cabeçalho da ficha — permanece branco (dados do paciente + navegação por abas). */
export const PATIENT_DETAIL_HEADER_SHELL_CLASS = 'bg-background px-4 pt-4 pb-0 md:px-6';

/** Área de conteúdo da aba ativa — fundo cinza. */
export const PATIENT_DETAIL_CONTENT_SHELL_CLASS =
  'flex-1 bg-muted/70 px-4 py-4 md:px-6 md:py-6';

/** Painel padrão das abas (contraste sobre o shell cinza). */
export const PATIENT_DETAIL_PANEL_CLASS =
  'rounded-2xl border border-border/60 bg-background shadow-none';

/** Variante mais suave para estados vazios e skeleton. */
export const PATIENT_DETAIL_PANEL_SOFT_CLASS =
  'rounded-2xl border border-border/60 bg-background/80 shadow-none';

/** Card de tabela na ficha — mesmo padrão da lista de pacientes. */
export const PATIENT_TABLE_CARD_CLASS = 'rounded-2xl border border-border/50 bg-card p-4';

/** Cabeçalho cinza das DataTables (lista de pacientes, orçamentos, etc.). */
export const PATIENT_DATA_TABLE_HEADER_CLASS =
  'bg-muted [&_tr]:border-0 [&_th]:border-0 [&_th]:!text-left [&_th]:text-foreground';

export const PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS =
  'bg-muted [&_tr]:border-0 [&_th]:border-0 [&_th]:!text-left [&_th]:text-foreground [&_th:last-child]:!text-right';

export const PATIENT_DATA_TABLE_CLASS =
  'border-collapse [&_td]:border-0 [&_tr]:border-0 [&_tbody_tr]:border-0';

export const PATIENT_DATA_TABLE_WITH_ACTIONS_CLASS =
  'border-collapse [&_td]:border-0 [&_tr]:border-0 [&_tbody_tr]:border-0 [&_td]:text-left [&_td:last-child]:text-right';

/** Separador de ponta a ponta como filho direto de modal com padding horizontal zero. */
export const PATIENT_MODAL_FULL_BLEED_SEPARATOR_CLASS =
  'h-px w-full shrink-0 bg-border';

/** Escapa `px-6` em seções internas do modal (ex.: separador da tabela). */
export const PATIENT_MODAL_INSET_BLEED_SEPARATOR_CLASS =
  '-mx-6 h-px shrink-0 bg-border';

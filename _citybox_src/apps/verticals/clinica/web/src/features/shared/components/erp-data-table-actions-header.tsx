'use client';

import { ERP_DATA_TABLE_ACTIONS_HEADER_CLASS } from '@/features/shared/lib/data-table-styles';

/** Cabeçalho visível da coluna de ações (alinhado à direita). */
export function ErpDataTableActionsHeader() {
  return <span className={ERP_DATA_TABLE_ACTIONS_HEADER_CLASS}>Ações</span>;
}

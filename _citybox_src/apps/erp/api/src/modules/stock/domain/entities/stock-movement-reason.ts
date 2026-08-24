import type {
  StockMovementSourceType,
  StockMovementType,
} from './stock-movement.entity';

/**
 * Motivo de uma movimentação de estoque.
 *
 * Os motivos do sistema vivem aqui, e não em linhas de `movement_categories`: os
 * fluxos automáticos precisam deles para operar, então depender de cadastro fazia
 * uma organização mal provisionada responder 404 ao fechar pedido de venda.
 *
 * `manual` é o único motivo em que o operador escolhe uma categoria — aí sim uma
 * linha do cadastro que ele mesmo mantém.
 */
export const STOCK_MOVEMENT_REASONS = [
  'manual',
  'sale',
  'purchase_entry',
  'production_in',
  'production_out',
  'transfer_in',
  'transfer_out',
  'inventory_in',
  'inventory_out',
] as const;
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

const REASON_BY_SOURCE: Record<
  Exclude<StockMovementSourceType, 'manual' | 'sale'>,
  Record<StockMovementType, StockMovementReason>
> = {
  purchase: { entrada: 'purchase_entry', saida: 'purchase_entry' },
  production: { entrada: 'production_in', saida: 'production_out' },
  transfer: { entrada: 'transfer_in', saida: 'transfer_out' },
  inventory: { entrada: 'inventory_in', saida: 'inventory_out' },
};

/**
 * O motivo já está gravado na movimentação: é o par (origem, tipo). Nenhuma
 * consulta a cadastro é necessária para saber por que o estoque mexeu.
 */
export function resolveStockMovementReason(
  sourceType: StockMovementSourceType,
  type: StockMovementType,
): StockMovementReason {
  if (sourceType === 'manual') return 'manual';
  if (sourceType === 'sale') return 'sale';
  return REASON_BY_SOURCE[sourceType][type];
}

/**
 * Traduz um motivo de volta para o filtro de banco. Motivos que não distinguem
 * entrada de saída devolvem `type: null`.
 */
export function stockMovementReasonToSource(reason: StockMovementReason): {
  sourceType: StockMovementSourceType;
  type: StockMovementType | null;
} {
  switch (reason) {
    case 'manual':
      return { sourceType: 'manual', type: null };
    case 'sale':
      return { sourceType: 'sale', type: null };
    case 'purchase_entry':
      return { sourceType: 'purchase', type: null };
    case 'production_in':
      return { sourceType: 'production', type: 'entrada' };
    case 'production_out':
      return { sourceType: 'production', type: 'saida' };
    case 'transfer_in':
      return { sourceType: 'transfer', type: 'entrada' };
    case 'transfer_out':
      return { sourceType: 'transfer', type: 'saida' };
    case 'inventory_in':
      return { sourceType: 'inventory', type: 'entrada' };
    case 'inventory_out':
      return { sourceType: 'inventory', type: 'saida' };
  }
}

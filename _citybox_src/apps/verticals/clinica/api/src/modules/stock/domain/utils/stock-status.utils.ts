import type { StockStatus } from '../stock-types';

export function calculateStockStatus(
  quantity: number,
  minQuantity: number,
): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minQuantity) return 'low_stock';
  return 'in_stock';
}

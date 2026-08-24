/** Limiar de “saldo baixo” — paridade com o front (`LOW_STOCK_THRESHOLD`). */
export const LOW_STOCK_THRESHOLD = 5;

export type StockBalanceStatus = 'ok' | 'low' | 'empty';

export function resolveStockBalanceStatus(
  quantity: number,
): StockBalanceStatus {
  if (quantity <= 0) return 'empty';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}

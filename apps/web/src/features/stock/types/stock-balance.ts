export type StockBalance = {
  stockId: string;
  productId: string;
  /** Saldo atual do produto neste estoque. */
  quantity: number;
  /** Unidade de exibição do saldo (un, kg, L…). */
  unit: string;
};

export type StockBalanceItem = StockBalance & {
  productName: string;
  productSku: string;
  productImageUrl?: string;
};

export type StockBalanceStatus = "ok" | "low" | "empty";

/** Abaixo (ou igual) deste saldo o produto é sinalizado como baixo. */
export const LOW_STOCK_THRESHOLD = 5;

export function getStockBalanceStatus(quantity: number): StockBalanceStatus {
  if (quantity <= 0) return "empty";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

export const STOCK_BALANCE_STATUS_LABELS: Record<StockBalanceStatus, string> = {
  ok: "Em estoque",
  low: "Saldo baixo",
  empty: "Sem saldo",
};

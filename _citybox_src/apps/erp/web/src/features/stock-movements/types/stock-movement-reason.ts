/**
 * Motivo da movimentação de estoque.
 *
 * Os motivos dos fluxos automáticos são fixos no sistema (a API os deriva da origem do
 * movimento), então o rótulo vive aqui e não é editável pelo lojista. Só o lançamento
 * manual usa uma categoria cadastrada, que ele mesmo mantém.
 */
export type StockMovementReason =
  | "manual"
  | "sale"
  | "purchase_entry"
  | "production_in"
  | "production_out"
  | "transfer_in"
  | "transfer_out"
  | "inventory_in"
  | "inventory_out";

export const STOCK_MOVEMENT_REASON_LABELS: Record<StockMovementReason, string> =
  {
    manual: "Lançamento manual",
    sale: "Venda",
    purchase_entry: "Compra",
    production_in: "Produção (entrada)",
    production_out: "Produção (consumo)",
    transfer_in: "Transferência (entrada)",
    transfer_out: "Transferência (saída)",
    inventory_in: "Inventário (entrada)",
    inventory_out: "Inventário (saída)",
  };

export const STOCK_MOVEMENT_REASON_FILTER_ORDER: StockMovementReason[] = [
  "manual",
  "sale",
  "purchase_entry",
  "transfer_in",
  "transfer_out",
  "inventory_in",
  "inventory_out",
  "production_in",
  "production_out",
];

/**
 * No lançamento manual quem nomeia o movimento é a categoria escolhida pelo operador;
 * nos demais, o próprio motivo.
 */
export function resolveStockMovementReasonLabel(movement: {
  reason: StockMovementReason;
  categoryName: string | null;
}): string {
  if (movement.reason === "manual") {
    return movement.categoryName ?? STOCK_MOVEMENT_REASON_LABELS.manual;
  }
  return STOCK_MOVEMENT_REASON_LABELS[movement.reason];
}

import type { SaleOrder } from "@/features/sales-orders/types/sale-order";

/**
 * Pedido/venda que não pode mais ser alterado no formulário.
 *
 * - `cancelled`: cancelamento PDV/ERP — só visualização.
 * - `stockMovementId`: estoque já foi movimentado (API bloqueia PUT).
 */
export function isSaleOrderReadOnly(
  order: Pick<SaleOrder, "status" | "stockMovementId">,
): boolean {
  return order.status === "cancelled" || Boolean(order.stockMovementId);
}

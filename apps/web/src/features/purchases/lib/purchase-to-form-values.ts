import {
  clonePurchaseFormValues,
  createEmptyPayment,
  createEmptyPurchaseFormValues,
} from "@/features/purchases/lib/purchase-form-values";
import type {
  PurchaseDetail,
  PurchaseFormValues,
} from "@/features/purchases/types/purchase";

/**
 * Pagamentos são só UI local (financeiro ainda não existe na API) —
 * na edição partimos de um stub vazio (não bloqueia salvar status/linhas).
 */
export function purchaseToFormValues(
  purchase: PurchaseDetail,
): PurchaseFormValues {
  return clonePurchaseFormValues({
    ...createEmptyPurchaseFormValues(),
    deliveryStatus: purchase.deliveryStatus,
    warehouseId: purchase.warehouseId,
    supplierId: purchase.supplierId,
    purchasedAt: purchase.purchasedAt,
    series: purchase.series,
    invoiceNumber: purchase.invoiceNumber,
    notes: purchase.notes,
    lines: purchase.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      costPrice: line.costPrice,
      status: line.status,
    })),
    extras: purchase.extras,
    payments: [createEmptyPayment()],
  });
}

import { StockMovement } from '../../domain/entities/stock-movement.entity';
import type { Purchase } from '../../domain/entities/purchase.entity';

/**
 * `purchasedAt` é data-only (`@db.Date`). Meio-dia UTC evita que o fuso do
 * servidor jogue o movimento para o dia anterior quando exibido localmente.
 */
function purchasedAtNoonUtc(purchasedAt: Date): Date {
  return new Date(
    Date.UTC(
      purchasedAt.getUTCFullYear(),
      purchasedAt.getUTCMonth(),
      purchasedAt.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  );
}

/**
 * Gera o `StockMovement` de entrada da compra recebida (regra F7 §2).
 *
 * Devolve `null` sem tocar o ledger quando: já existe `stockMovementId`
 * (§3, nunca gera 2ª vez), a entrega não está `received`, ou nenhuma linha
 * está com status `received`. Compartilhada entre create/update.
 */
export function buildPurchaseEntryMovement(
  purchase: Purchase,
  createdByUserId: string,
): StockMovement | null {
  if (purchase.stockMovementId) return null;
  if (purchase.deliveryStatus !== 'received') return null;

  const receivedLines = purchase.receivedLines;
  if (receivedLines.length === 0) return null;

  return StockMovement.create({
    organizationId: purchase.organizationId,
    stockId: purchase.stockId,
    type: 'entrada',
    operatedAt: purchasedAtNoonUtc(purchase.purchasedAt),
    createdByUserId,
    sourceType: 'purchase',
    sourceId: purchase.id,
    lines: receivedLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      costCents: line.costCents,
    })),
  });
}

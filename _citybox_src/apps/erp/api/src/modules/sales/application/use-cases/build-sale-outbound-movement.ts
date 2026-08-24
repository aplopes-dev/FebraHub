import { StockMovement } from '../../../stock/domain/entities/stock-movement.entity';
import type { SaleOrder } from '../../domain/entities/sale-order.entity';
import { StockProductLookup } from '../../../stock/domain/repositories/stock-movement.repository.interface';
import { SaleOrderStockRequiredError } from '../../domain/errors/sale-order-stock-required.error';

export type BuildSaleOutboundMovementDeps = {
  stockProductLookup: StockProductLookup;
};

/**
 * Gera o `StockMovement` de saída do pedido fechado (regra F9 §2).
 *
 * Só entram na movimentação as linhas cujo produto tem `trackStock=true` —
 * um pedido com só serviços/produtos não controlados fecha sem gerar nenhum
 * movimento. Devolve `null` sem tocar o ledger quando: já existe
 * `stockMovementId` (idempotência, nunca gera 2ª vez), o pedido não está
 * `closed`, ou nenhuma linha é de produto controlado.
 *
 * Compartilhada entre create/update/update-status.
 */
export async function buildSaleOutboundMovement(
  deps: BuildSaleOutboundMovementDeps,
  saleOrder: SaleOrder,
  createdByUserId: string,
): Promise<StockMovement | null> {
  if (saleOrder.stockMovementId) return null;
  if (saleOrder.status !== 'closed') return null;

  const trackableLines: Array<
    SaleOrder['lines'][number] & { productId: string }
  > = [];
  for (const line of saleOrder.lines) {
    // Linha de serviço (sem `productId`) nunca é controlada — não entra no
    // movimento de estoque (spec erp/031 D1).
    if (!line.productId) continue;

    const product = await deps.stockProductLookup.findTrackable(
      saleOrder.organizationId,
      line.productId,
    );
    if (product && !product.deletedAt && product.trackStock) {
      trackableLines.push({ ...line, productId: line.productId });
    }
  }

  if (trackableLines.length === 0) return null;

  if (!saleOrder.stockId) {
    throw new SaleOrderStockRequiredError();
  }

  return StockMovement.create({
    organizationId: saleOrder.organizationId,
    stockId: saleOrder.stockId,
    type: 'saida',
    operatedAt: new Date(),
    createdByUserId,
    sourceType: 'sale',
    sourceId: saleOrder.id,
    lines: trackableLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      costCents: line.unitPriceCents,
    })),
  });
}

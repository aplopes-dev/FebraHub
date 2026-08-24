import { Prisma } from '../../../../../generated/prisma/client';
import { StockMovement } from '../../domain/entities/stock-movement.entity';

/**
 * Persiste movimento + linhas e atualiza saldos dentro de uma transação
 * Prisma já aberta (ledger atômico).
 *
 * Saída **pode** deixar o saldo negativo (política deliberada — PDV/ERP
 * não bloqueiam venda por falta de estoque).
 *
 * `tx` é o cliente da transaction scoped (extension tenant) — tipagem frouxa
 * porque o Prisma extended não casa com `TransactionClient` padrão.
 */
export async function persistStockMovementInTx(
  tx: any,
  movement: StockMovement,
): Promise<void> {
  await tx.stockMovement.create({
    data: {
      id: movement.id,
      organizationId: movement.organizationId,
      stockId: movement.stockId,
      categoryId: movement.categoryId,
      type: movement.type,
      operatedAt: movement.operatedAt,
      createdByUserId: movement.createdByUserId,
      sourceType: movement.sourceType,
      sourceId: movement.sourceId,
      createdAt: movement.createdAt,
    },
  });

  await tx.stockMovementLine.createMany({
    data: movement.lines.map((line) => ({
      organizationId: movement.organizationId,
      stockMovementId: movement.id,
      productId: line.productId,
      quantity: new Prisma.Decimal(line.quantity),
      costCents: line.costCents,
    })),
  });

  for (const line of movement.lines) {
    const qty = new Prisma.Decimal(line.quantity);
    const delta = movement.type === 'entrada' ? qty : qty.negated();

    await tx.$executeRaw`
      INSERT INTO erp.stock_balances (
        id, organization_id, stock_id, product_id, quantity, updated_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${movement.organizationId},
        ${movement.stockId},
        ${line.productId},
        ${delta}::numeric,
        NOW()
      )
      ON CONFLICT (stock_id, product_id)
      DO UPDATE SET
        quantity = erp.stock_balances.quantity + EXCLUDED.quantity,
        updated_at = NOW()
    `;
  }
}

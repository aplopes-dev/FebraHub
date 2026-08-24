import type { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';

/** Soma o saldo de um produto (escopo branch opcional — D1). */
export async function resolveProductStock(
  stockMovementRepository: StockMovementRepository,
  organizationId: string,
  productId: string,
  branchId?: string | null,
): Promise<number> {
  const map = await stockMovementRepository.sumQuantitiesByProductIds(
    organizationId,
    [productId],
    { branchId: branchId?.trim() || undefined },
  );
  return map.get(productId) ?? 0;
}

import { SupplierRepository } from '../../../../stock/suppliers/domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../../../stock/suppliers/domain/errors/supplier-not-found.error';

/**
 * Confere que o fornecedor vinculado ao lançamento existe, é da organização
 * ativa e não está excluído.
 */
export async function assertSupplierExists(
  supplierRepository: SupplierRepository,
  organizationId: string,
  supplierId: string | null | undefined,
): Promise<string | null> {
  if (!supplierId) return null;

  const supplier = await supplierRepository.findById(
    organizationId,
    supplierId,
  );
  if (!supplier || supplier.deletedAt) {
    throw new SupplierNotFoundError(supplierId);
  }

  return supplierId;
}

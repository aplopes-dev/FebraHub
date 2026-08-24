import { CarrierRepository } from '../../carriers/domain/repositories/carrier.repository.interface';
import { CarrierNotFoundError } from '../../carriers/domain/errors/carrier-not-found.error';
import { SupplierRepository } from '../../suppliers/domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../suppliers/domain/errors/supplier-not-found.error';
import { StockRepository } from '../../domain/repositories/stock.repository.interface';
import { StockNotFoundError } from '../../domain/errors/stock-not-found.error';
import { StockProductLookup } from '../../domain/repositories/stock-movement.repository.interface';
import { ProductNotTrackableError } from '../../domain/errors/product-not-trackable.error';
import { ProductNotFoundError } from '../../../catalog/domain/errors/product-not-found.error';

export type AssertPurchaseReferencesDeps = {
  stockRepository: StockRepository;
  supplierRepository: SupplierRepository;
  carrierRepository: CarrierRepository;
  stockProductLookup: StockProductLookup;
};

export type AssertPurchaseReferencesInput = {
  organizationId: string;
  stockId: string;
  supplierId: string;
  carrierId?: string | null;
  lines: Array<{ productId: string }>;
};

/**
 * Confere estoque, fornecedor, transportadora (opcional) e produtos das
 * linhas antes de criar/atualizar uma compra (regra F7 §5/§6).
 *
 * Compartilhada entre create/update para as duas rotas nunca divergirem na
 * validação de referências.
 */
export async function assertPurchaseReferences(
  deps: AssertPurchaseReferencesDeps,
  input: AssertPurchaseReferencesInput,
): Promise<void> {
  const stock = await deps.stockRepository.findById(
    input.organizationId,
    input.stockId,
  );
  if (!stock) throw new StockNotFoundError(input.stockId);

  const supplier = await deps.supplierRepository.findById(
    input.organizationId,
    input.supplierId,
  );
  if (!supplier || supplier.deletedAt) {
    throw new SupplierNotFoundError(input.supplierId);
  }

  if (input.carrierId) {
    const carrier = await deps.carrierRepository.findById(
      input.organizationId,
      input.carrierId,
    );
    if (!carrier || carrier.deletedAt) {
      throw new CarrierNotFoundError(input.carrierId);
    }
  }

  for (const line of input.lines) {
    const product = await deps.stockProductLookup.findTrackable(
      input.organizationId,
      line.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(line.productId);
    }
    if (!product.trackStock) {
      throw new ProductNotTrackableError(line.productId);
    }
  }
}

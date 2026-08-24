import { CustomerRepository } from '../../../customers/domain/repositories/customer.repository.interface';
import { CustomerNotFoundError } from '../../../customers/domain/errors/customer-not-found.error';
import { StockRepository } from '../../../stock/domain/repositories/stock.repository.interface';
import { StockNotFoundError } from '../../../stock/domain/errors/stock-not-found.error';
import { StockProductLookup } from '../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductNotFoundError } from '../../../catalog/domain/errors/product-not-found.error';

export type AssertSaleOrderReferencesDeps = {
  customerRepository: CustomerRepository;
  stockRepository: StockRepository;
  stockProductLookup: StockProductLookup;
};

export type AssertSaleOrderReferencesInput = {
  organizationId: string;
  customerId?: string | null;
  stockId?: string | null;
  /** `productId: null` = linha de serviço (spec erp/031 D1) — sem produto a validar. */
  lines: Array<{ productId: string | null }>;
};

/**
 * Confere cliente (opcional), estoque (opcional) e produtos das linhas antes
 * de criar/atualizar um pedido de venda.
 *
 * Diferente de `assertPurchaseReferences`: aqui o produto NÃO precisa ter
 * `trackStock=true` — o pedido pode misturar produtos controlados e serviços.
 * Só existência/soft-delete são validados aqui; a trackabilidade é decidida
 * na hora de montar o movimento de saída (`buildSaleOutboundMovement`).
 *
 * Compartilhada entre create/update para as duas rotas nunca divergirem na
 * validação de referências.
 */
export async function assertSaleOrderReferences(
  deps: AssertSaleOrderReferencesDeps,
  input: AssertSaleOrderReferencesInput,
): Promise<void> {
  if (input.customerId) {
    const customer = await deps.customerRepository.findById(
      input.organizationId,
      input.customerId,
    );
    if (!customer || customer.deletedAt) {
      throw new CustomerNotFoundError(input.customerId);
    }
  }

  if (input.stockId) {
    const stock = await deps.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);
  }

  for (const line of input.lines) {
    // Linha de serviço (sem `productId`) não tem produto de catálogo a validar.
    if (!line.productId) continue;

    const product = await deps.stockProductLookup.findTrackable(
      input.organizationId,
      line.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(line.productId);
    }
  }
}

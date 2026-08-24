import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Produto existe mas não pode virar ordem de produção: sem ficha técnica, a
 * ficha não é `productive_process`, ou o produto é `supply` (insumo puro,
 * não faz sentido produzi-lo).
 */
export class ProductionProductNotEligibleError extends DomainError {
  constructor(productId: string, reason: string) {
    super({
      internalMessage: `Product ${productId} not eligible for production: ${reason}`,
      externalMessage: reason,
      context: ProductionProductNotEligibleError.name,
    });
  }
}

import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductSkuTakenError extends DomainError {
  constructor(sku: string) {
    super({
      internalMessage: `Product SKU ${sku} already taken in this store`,
      externalMessage: `Já existe um produto com o código (SKU) "${sku}"`,
      context: ProductSkuTakenError.name,
    });
  }
}

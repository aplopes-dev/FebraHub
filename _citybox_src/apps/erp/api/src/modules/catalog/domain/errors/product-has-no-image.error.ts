import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductHasNoImageError extends DomainError {
  constructor(productId: string) {
    super({
      internalMessage: `Product ${productId} has no image`,
      externalMessage: 'Produto sem imagem',
      context: ProductHasNoImageError.name,
    });
  }
}

import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Product not found: ${id}`,
      externalMessage: 'Produto não encontrado.',
      context: 'Products',
    });
  }
}

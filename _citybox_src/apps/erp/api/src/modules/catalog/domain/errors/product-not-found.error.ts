import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Product ${id} not found`,
      externalMessage: 'Produto não encontrado',
      context: ProductNotFoundError.name,
    });
  }
}

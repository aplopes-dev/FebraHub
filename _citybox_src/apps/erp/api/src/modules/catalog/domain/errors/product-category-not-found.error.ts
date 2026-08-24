import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ProductCategory ${id} not found`,
      externalMessage: 'Categoria não encontrada',
      context: ProductCategoryNotFoundError.name,
    });
  }
}

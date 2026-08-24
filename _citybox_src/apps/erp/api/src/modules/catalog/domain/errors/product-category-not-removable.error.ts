import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductCategoryNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ProductCategory ${id} is provisioned by the system and cannot be deleted`,
      externalMessage:
        'Categorias de produto do sistema não podem ser excluídas.',
      context: ProductCategoryNotRemovableError.name,
    });
  }
}

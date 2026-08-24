import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductCategoryNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Product category name ${name} already taken in this store`,
      externalMessage: `Já existe uma categoria com o nome "${name}"`,
      context: ProductCategoryNameTakenError.name,
    });
  }
}

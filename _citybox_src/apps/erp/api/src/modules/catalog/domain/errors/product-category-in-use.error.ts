import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductCategoryInUseError extends DomainError {
  constructor(name: string, productCount: number) {
    super({
      internalMessage: `Product category ${name} has ${productCount} linked products`,
      externalMessage: `A categoria "${name}" possui ${productCount} produto(s) vinculado(s) e não pode ser excluída`,
      context: ProductCategoryInUseError.name,
    });
  }
}

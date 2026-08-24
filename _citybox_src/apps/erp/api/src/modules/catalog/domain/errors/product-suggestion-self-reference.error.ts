import { DomainError } from '../../../../shared/core/errors/domain.error';

/** FR-015: um produto não pode se autossugerir. */
export class ProductSuggestionSelfReferenceError extends DomainError {
  constructor(productId: string) {
    super({
      internalMessage: `Product ${productId} cannot suggest itself`,
      externalMessage: 'Um produto não pode ser sugestão de si mesmo',
      context: ProductSuggestionSelfReferenceError.name,
    });
  }
}

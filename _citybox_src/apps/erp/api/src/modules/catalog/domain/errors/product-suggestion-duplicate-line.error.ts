import { DomainError } from '../../../../shared/core/errors/domain.error';

/** FR-014: um produto sugerido não pode aparecer 2x na lista do mesmo produto dono. */
export class ProductSuggestionDuplicateLineError extends DomainError {
  constructor(suggestedProductId: string) {
    super({
      internalMessage: `Product ${suggestedProductId} referenced more than once in the product's suggestions`,
      externalMessage: 'Um produto não pode ser sugerido mais de uma vez',
      context: ProductSuggestionDuplicateLineError.name,
    });
  }
}

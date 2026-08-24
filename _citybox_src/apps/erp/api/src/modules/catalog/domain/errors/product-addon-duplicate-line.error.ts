import { DomainError } from '../../../../shared/core/errors/domain.error';

/** FR-009: um adicional não pode aparecer 2x na lista do mesmo produto. */
export class ProductAddonDuplicateLineError extends DomainError {
  constructor(addonId: string) {
    super({
      internalMessage: `Addon ${addonId} referenced more than once in the product's addon lines`,
      externalMessage: 'Um adicional não pode ser selecionado mais de uma vez',
      context: ProductAddonDuplicateLineError.name,
    });
  }
}

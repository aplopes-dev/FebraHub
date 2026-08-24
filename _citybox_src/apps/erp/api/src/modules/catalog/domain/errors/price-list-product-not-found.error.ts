import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PriceListProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super({
      internalMessage: `Product ${productId} not found for price list item`,
      externalMessage: 'Um ou mais produtos da lista não foram encontrados',
      context: PriceListProductNotFoundError.name,
    });
  }
}

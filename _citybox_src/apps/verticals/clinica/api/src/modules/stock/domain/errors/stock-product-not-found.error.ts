import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockProductNotFoundError extends DomainError {
  constructor(context: string, productId: string) {
    super({
      internalMessage: `Stock product not found: ${productId}`,
      externalMessage: 'Produto não encontrado',
      context,
    });
  }
}

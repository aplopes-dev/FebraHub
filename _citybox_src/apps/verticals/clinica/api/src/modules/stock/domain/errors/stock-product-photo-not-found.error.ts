import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockProductPhotoNotFoundError extends DomainError {
  constructor(context: string, productId: string) {
    super({
      internalMessage: `Stock product photo not found for product: ${productId}`,
      externalMessage: 'Foto do produto não encontrada',
      context,
    });
  }
}

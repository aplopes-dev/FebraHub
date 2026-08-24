import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InsufficientStockError extends DomainError {
  constructor(productId: string, available: number, requested: number) {
    super({
      internalMessage: `Insufficient stock for product ${productId}: available=${available}, requested=${requested}`,
      externalMessage: `Estoque insuficiente. Disponível: ${available}.`,
      context: 'Products',
    });
  }
}

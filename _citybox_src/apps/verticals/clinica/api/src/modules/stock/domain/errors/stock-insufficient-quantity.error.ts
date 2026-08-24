import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockInsufficientQuantityError extends DomainError {
  constructor(context: string, available: number, requested: number) {
    super({
      internalMessage: `Insufficient quantity. Available=${available} requested=${requested}`,
      externalMessage:
        'Quantidade insuficiente no estoque para realizar a retirada',
      context,
    });
  }
}

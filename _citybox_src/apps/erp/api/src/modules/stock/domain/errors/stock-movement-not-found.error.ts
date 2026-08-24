import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockMovementNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `StockMovement ${id} not found in the current organization`,
      externalMessage: 'Movimentação não encontrada',
      context: StockMovementNotFoundError.name,
    });
  }
}

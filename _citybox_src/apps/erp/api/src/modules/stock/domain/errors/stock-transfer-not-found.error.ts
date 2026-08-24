import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockTransferNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `StockTransfer ${id} not found in the current organization`,
      externalMessage: 'Transferência não encontrada',
      context: StockTransferNotFoundError.name,
    });
  }
}

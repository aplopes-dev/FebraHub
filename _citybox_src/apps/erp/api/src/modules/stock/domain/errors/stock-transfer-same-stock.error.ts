import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockTransferSameStockError extends DomainError {
  constructor() {
    super({
      internalMessage: 'StockTransfer fromStockId equals toStockId',
      externalMessage: 'O estoque de saída deve ser diferente do de entrada.',
      context: StockTransferSameStockError.name,
    });
  }
}

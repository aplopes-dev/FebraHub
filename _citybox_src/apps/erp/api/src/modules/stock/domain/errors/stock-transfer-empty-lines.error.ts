import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockTransferEmptyLinesError extends DomainError {
  constructor() {
    super({
      internalMessage: 'StockTransfer create attempted without lines',
      externalMessage: 'Informe ao menos um produto na transferência.',
      context: StockTransferEmptyLinesError.name,
    });
  }
}

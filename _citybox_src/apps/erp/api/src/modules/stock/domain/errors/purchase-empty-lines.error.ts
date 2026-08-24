import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PurchaseEmptyLinesError extends DomainError {
  constructor() {
    super({
      internalMessage: 'Purchase create/update attempted without lines',
      externalMessage: 'Informe ao menos um produto na compra.',
      context: PurchaseEmptyLinesError.name,
    });
  }
}

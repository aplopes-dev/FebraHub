import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SaleOrderEmptyLinesError extends DomainError {
  constructor() {
    super({
      internalMessage: 'SaleOrder create/update attempted without lines',
      externalMessage: 'Informe ao menos um produto no pedido.',
      context: SaleOrderEmptyLinesError.name,
    });
  }
}

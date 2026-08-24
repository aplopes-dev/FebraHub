import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SaleOrderNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `SaleOrder ${id} not found in the current organization`,
      externalMessage: 'Pedido de venda não encontrado',
      context: SaleOrderNotFoundError.name,
    });
  }
}

import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Pedido já gerou saída no estoque — edição completa (PUT) bloqueada. */
export class SaleOrderAlreadyClosedError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `SaleOrder ${id} already has stockMovementId and cannot be updated`,
      externalMessage:
        'Este pedido já foi fechado e o estoque foi atualizado. Ele não pode mais ser editado.',
      context: SaleOrderAlreadyClosedError.name,
    });
  }
}

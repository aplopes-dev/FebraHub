import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Compra já gerou entrada no estoque — edição bloqueada (idempotência do ledger). */
export class PurchaseAlreadyReceivedError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Purchase ${id} already has stockMovementId and cannot be updated`,
      externalMessage:
        'Esta compra já foi recebida e o estoque foi atualizado. Ela não pode mais ser editada.',
      context: PurchaseAlreadyReceivedError.name,
    });
  }
}

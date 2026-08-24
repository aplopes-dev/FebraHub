import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PaymentMethodNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PaymentMethod ${id} is provisioned by the system and cannot be deleted`,
      externalMessage:
        'Formas de pagamento do sistema não podem ser excluídas.',
      context: PaymentMethodNotRemovableError.name,
    });
  }
}

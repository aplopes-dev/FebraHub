import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PaymentMethodNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Payment method ${id} not found in the current organization`,
      externalMessage: 'Forma de pagamento não encontrada',
      context: PaymentMethodNotFoundError.name,
    });
  }
}

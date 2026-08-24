import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CardPaymentMethodNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Card payment method ${id} not found in the current contract`,
      externalMessage: 'Forma de pagamento não encontrada neste contrato',
      context: CardPaymentMethodNotFoundError.name,
    });
  }
}

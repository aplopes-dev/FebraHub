import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSalePaymentMethodInvalidError extends DomainError {
  constructor(methodId: string) {
    super({
      internalMessage: `PaymentMethod ${methodId} is missing or deleted`,
      externalMessage: 'Forma de pagamento inválida ou inativa.',
      context: PosSalePaymentMethodInvalidError.name,
    });
  }
}

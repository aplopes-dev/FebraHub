import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PaymentMethodNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Payment method name ${name} already used in this organization`,
      externalMessage:
        'Já existe uma forma de pagamento com este nome nesta organização',
      context: PaymentMethodNameTakenError.name,
    });
  }
}

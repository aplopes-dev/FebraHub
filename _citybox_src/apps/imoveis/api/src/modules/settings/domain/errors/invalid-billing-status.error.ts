import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidBillingStatusError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid billing status: ${value}`,
      externalMessage:
        'Status de assinatura inválido. Use active, past_due ou canceled',
      context,
    });
  }
}

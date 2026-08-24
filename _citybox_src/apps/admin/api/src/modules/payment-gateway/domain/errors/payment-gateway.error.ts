import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PaymentGatewayError extends DomainError {
  constructor(
    context: string,
    internalMessage: string,
    externalMessage = 'Erro na integração com gateway de pagamento',
  ) {
    super({
      internalMessage,
      externalMessage,
      context,
    });
  }
}

import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidWebhookSignatureError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Invalid webhook signature',
      externalMessage: 'Assinatura do webhook inválida',
      context,
    });
  }
}

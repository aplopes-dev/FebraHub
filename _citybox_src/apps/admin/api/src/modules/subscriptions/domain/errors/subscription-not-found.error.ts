import { DomainError } from '../../../../shared/core/errors/domain.error';

export class SubscriptionNotFoundError extends DomainError {
  constructor(context: string, subscriptionId: string) {
    super({
      internalMessage: `Subscription "${subscriptionId}" not found`,
      externalMessage: 'Assinatura não encontrada',
      context,
    });
  }
}

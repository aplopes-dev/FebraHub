import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ActiveSubscriptionConflictError extends DomainError {
  constructor(context: string, clientId: string) {
    super({
      internalMessage: `Client "${clientId}" already has an active subscription`,
      externalMessage: 'Este cliente já possui uma assinatura ativa',
      context,
    });
  }
}

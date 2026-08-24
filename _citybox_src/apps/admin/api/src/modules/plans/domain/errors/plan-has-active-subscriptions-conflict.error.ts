import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PlanHasActiveSubscriptionsConflictError extends DomainError {
  constructor(context: string, planId: string, subscriberCount: number) {
    super({
      internalMessage: `Plan "${planId}" cannot be deleted: ${subscriberCount} subscription(s) linked`,
      externalMessage: `Não é possível excluir este plano, existem ${subscriberCount} assinatura(s) vinculada(s). Cancele ou altere as assinaturas antes de excluir o plano.`,
      context,
    });
  }
}

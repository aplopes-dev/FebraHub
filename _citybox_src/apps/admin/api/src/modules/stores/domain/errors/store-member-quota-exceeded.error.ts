import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreMemberQuotaExceededError extends DomainError {
  constructor(context: string, maxUsers: number) {
    super({
      internalMessage: `Store member quota exceeded. Max members per store allowed: ${maxUsers}`,
      externalMessage: `Limite de membros da equipe foi excedido (${maxUsers} membros).`,
      context,
    });
  }
}

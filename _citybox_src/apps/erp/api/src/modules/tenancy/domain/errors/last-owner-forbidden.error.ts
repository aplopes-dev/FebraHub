import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Toda organização precisa de pelo menos um responsável ativo. Sem esta trava,
 * remover ou rebaixar o último OWNER deixaria a empresa sem ninguém capaz de
 * gerir membros — um beco sem saída que só o suporte resolveria.
 */
export class LastOwnerForbiddenError extends DomainError {
  constructor(organizationId: string) {
    super({
      internalMessage: `Refusing to leave organization ${organizationId} without an active owner`,
      externalMessage:
        'A organização precisa de pelo menos um responsável ativo. Promova outro membro a responsável antes.',
      context: LastOwnerForbiddenError.name,
    });
  }
}

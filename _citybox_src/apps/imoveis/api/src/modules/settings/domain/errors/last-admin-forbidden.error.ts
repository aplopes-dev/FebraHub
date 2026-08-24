import { DomainError } from '../../../../shared/core/errors/domain.error';

/** A loja precisa manter pelo menos um administrador ativo. */
export class LastAdminForbiddenError extends DomainError {
  constructor(context: string, agentId: string) {
    super({
      internalMessage: `Cannot remove the last admin: ${agentId}`,
      externalMessage:
        'Não é possível remover o último administrador da equipe',
      context,
    });
  }
}

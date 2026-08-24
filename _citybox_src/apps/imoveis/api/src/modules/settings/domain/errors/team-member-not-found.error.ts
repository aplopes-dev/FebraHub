import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TeamMemberNotFoundError extends DomainError {
  constructor(context: string, agentId: string) {
    super({
      internalMessage: `Team member not found: ${agentId}`,
      externalMessage: 'Usuário não encontrado',
      context,
    });
  }
}

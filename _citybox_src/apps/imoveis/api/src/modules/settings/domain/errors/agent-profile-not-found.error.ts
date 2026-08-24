import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AgentProfileNotFoundError extends DomainError {
  constructor(context: string, agentId: string) {
    super({
      internalMessage: `Agent profile not found: ${agentId}`,
      externalMessage: 'Perfil do corretor não encontrado',
      context,
    });
  }
}

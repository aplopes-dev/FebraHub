import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AgentProfilePhotoNotFoundError extends DomainError {
  constructor(context: string, agentId: string) {
    super({
      internalMessage: `Agent profile photo not found: ${agentId}`,
      externalMessage: 'Foto do perfil não encontrada',
      context,
    });
  }
}

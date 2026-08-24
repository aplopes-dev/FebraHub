import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AgentDeviceSessionNotFoundError extends DomainError {
  constructor(context: string, sessionId: string) {
    super({
      internalMessage: `Agent device session not found: ${sessionId}`,
      externalMessage: 'Sessão não encontrada',
      context,
    });
  }
}

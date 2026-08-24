import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AgentDeviceSessionNotFoundError } from '../../../domain/errors/agent-device-session-not-found.error';
import { CurrentSessionForbiddenError } from '../../../domain/errors/current-session-forbidden.error';
import { AgentDeviceSessionRepository } from '../../../domain/repositories/agent-device-session.repository.interface';

export type DeleteAgentSessionInput = {
  storeId: string;
  agentId: string;
  sessionId: string;
};

/** Encerrar a sessão atual deslogaria quem está usando o painel. */
@Injectable()
export class DeleteAgentSessionUseCase implements IUseCase<
  DeleteAgentSessionInput,
  void
> {
  constructor(private readonly sessions: AgentDeviceSessionRepository) {}

  async execute(input: DeleteAgentSessionInput): Promise<void> {
    const session = await this.sessions.findById(
      input.storeId,
      input.agentId,
      input.sessionId,
    );
    if (!session) {
      throw new AgentDeviceSessionNotFoundError(
        DeleteAgentSessionUseCase.name,
        input.sessionId,
      );
    }
    if (session.isCurrent) {
      throw new CurrentSessionForbiddenError(
        DeleteAgentSessionUseCase.name,
        input.sessionId,
      );
    }

    await this.sessions.delete(input.storeId, input.agentId, input.sessionId);
  }
}

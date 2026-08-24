import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AgentDeviceSessionEntity } from '../../../domain/entities/agent-device-session.entity';
import { AgentDeviceSessionRepository } from '../../../domain/repositories/agent-device-session.repository.interface';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type GetAgentPrivacyInput = {
  storeId: string;
  agentId: string;
};

export type GetAgentPrivacyResult = {
  twoFactorEnabled: boolean;
  sessions: AgentDeviceSessionEntity[];
};

/** Get-or-create: sem sessões salvas, cria a sessão atual padrão. */
@Injectable()
export class GetAgentPrivacyUseCase implements IUseCase<
  GetAgentPrivacyInput,
  GetAgentPrivacyResult
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly sessions: AgentDeviceSessionRepository,
  ) {}

  async execute(input: GetAgentPrivacyInput): Promise<GetAgentPrivacyResult> {
    const profile = await this.profiles.ensure(input.storeId, input.agentId);
    const existing = await this.sessions.findAll(input.storeId, input.agentId);

    if (existing.length > 0) {
      return { twoFactorEnabled: profile.twoFactorEnabled, sessions: existing };
    }

    const fallback = AgentDeviceSessionEntity.currentDefault(
      input.storeId,
      input.agentId,
    );
    const created = await this.sessions.create(input.storeId, input.agentId, {
      device: fallback.device,
      location: fallback.location,
      lastActiveLabel: fallback.lastActiveLabel,
      isCurrent: fallback.isCurrent,
    });

    return { twoFactorEnabled: profile.twoFactorEnabled, sessions: [created] };
  }
}

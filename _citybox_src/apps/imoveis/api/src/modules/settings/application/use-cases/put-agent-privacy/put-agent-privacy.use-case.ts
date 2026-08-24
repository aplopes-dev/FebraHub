import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type PutAgentPrivacyInput = {
  storeId: string;
  agentId: string;
  twoFactorEnabled: boolean;
};

@Injectable()
export class PutAgentPrivacyUseCase implements IUseCase<
  PutAgentPrivacyInput,
  AgentProfileEntity
> {
  constructor(private readonly profiles: AgentProfileRepository) {}

  async execute(input: PutAgentPrivacyInput): Promise<AgentProfileEntity> {
    await this.profiles.ensure(input.storeId, input.agentId);
    const updated = await this.profiles.setTwoFactor(
      input.storeId,
      input.agentId,
      input.twoFactorEnabled,
    );
    if (!updated) {
      throw new AgentProfileNotFoundError(
        PutAgentPrivacyUseCase.name,
        input.agentId,
      );
    }
    return updated;
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AgentProfilePhotoNotFoundError } from '../../../../settings/domain/errors/agent-profile-photo-not-found.error';
import { AgentProfileRepository } from '../../../../settings/domain/repositories/agent-profile.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import { resolveActivePublicAgent } from '../../policies/resolve-active-public-agent';

export type GetPublicAgentPhotoInput = {
  storeId: string;
  slug: string;
};

export type GetPublicAgentPhotoResult = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetPublicAgentPhotoUseCase implements IUseCase<
  GetPublicAgentPhotoInput,
  GetPublicAgentPhotoResult
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: GetPublicAgentPhotoInput,
  ): Promise<GetPublicAgentPhotoResult> {
    const member = await resolveActivePublicAgent(
      this.members,
      input.storeId,
      input.slug,
      GetPublicAgentPhotoUseCase.name,
    );
    const profile = await this.profiles.findByAgentId(
      input.storeId,
      member.agentId,
    );
    if (!profile?.photo) {
      throw new AgentProfilePhotoNotFoundError(
        GetPublicAgentPhotoUseCase.name,
        member.agentId,
      );
    }

    const stored = await this.storage.get(profile.photo.objectKey);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}

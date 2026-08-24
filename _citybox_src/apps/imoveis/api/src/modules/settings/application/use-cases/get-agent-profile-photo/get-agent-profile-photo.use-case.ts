import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AgentProfilePhotoNotFoundError } from '../../../domain/errors/agent-profile-photo-not-found.error';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type GetAgentProfilePhotoInput = {
  storeId: string;
  agentId: string;
};

export type GetAgentProfilePhotoResult = {
  buffer: Buffer;
  mimeType: string;
};

@Injectable()
export class GetAgentProfilePhotoUseCase implements IUseCase<
  GetAgentProfilePhotoInput,
  GetAgentProfilePhotoResult
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: GetAgentProfilePhotoInput,
  ): Promise<GetAgentProfilePhotoResult> {
    const profile = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!profile?.photo) {
      throw new AgentProfilePhotoNotFoundError(
        GetAgentProfilePhotoUseCase.name,
        input.agentId,
      );
    }

    const stored = await this.storage.get(profile.photo.objectKey);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}

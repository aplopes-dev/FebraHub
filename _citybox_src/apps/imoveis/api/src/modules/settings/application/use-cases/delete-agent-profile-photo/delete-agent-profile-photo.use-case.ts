import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { AgentProfilePhotoNotFoundError } from '../../../domain/errors/agent-profile-photo-not-found.error';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type DeleteAgentProfilePhotoInput = {
  storeId: string;
  agentId: string;
};

@Injectable()
export class DeleteAgentProfilePhotoUseCase implements IUseCase<
  DeleteAgentProfilePhotoInput,
  AgentProfileEntity
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: DeleteAgentProfilePhotoInput,
  ): Promise<AgentProfileEntity> {
    const profile = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!profile) {
      throw new AgentProfileNotFoundError(
        DeleteAgentProfilePhotoUseCase.name,
        input.agentId,
      );
    }
    const photo = profile.photo;
    if (!photo) {
      throw new AgentProfilePhotoNotFoundError(
        DeleteAgentProfilePhotoUseCase.name,
        input.agentId,
      );
    }

    const updated = await this.profiles.setPhoto(
      input.storeId,
      input.agentId,
      null,
    );
    if (!updated) {
      throw new AgentProfileNotFoundError(
        DeleteAgentProfilePhotoUseCase.name,
        input.agentId,
      );
    }

    await this.storage.delete(photo.objectKey);
    return updated;
  }
}

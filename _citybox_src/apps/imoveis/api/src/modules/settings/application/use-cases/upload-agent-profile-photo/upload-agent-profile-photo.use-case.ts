import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ImoveisObjectKeyPolicy } from '../../../../properties/application/policies/imoveis-object-key.policy';
import { ImageFileValidator } from '../../../../properties/application/validators/image-file.validator';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type UploadAgentProfilePhotoInput = {
  storeId: string;
  agentId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

@Injectable()
export class UploadAgentProfilePhotoUseCase implements IUseCase<
  UploadAgentProfilePhotoInput,
  AgentProfileEntity
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: UploadAgentProfilePhotoInput,
  ): Promise<AgentProfileEntity> {
    const mimeType = ImageFileValidator.validate(
      input.buffer,
      input.declaredMimeType,
    );

    const profile = await this.profiles.ensure(input.storeId, input.agentId);
    const previous = profile.photo;

    const objectKey = ImoveisObjectKeyPolicy.agentProfilePhotoKey(
      input.storeId,
      input.agentId,
      mimeType,
    );

    await this.storage.put({ key: objectKey, buffer: input.buffer, mimeType });

    const updated = await this.profiles.setPhoto(input.storeId, input.agentId, {
      objectKey,
      mimeType,
    });
    if (!updated) {
      await this.storage.delete(objectKey);
      throw new AgentProfileNotFoundError(
        UploadAgentProfilePhotoUseCase.name,
        input.agentId,
      );
    }

    // Troca de extensão (png → jpg) gera key nova; o objeto antigo fica órfão.
    if (previous && previous.objectKey !== objectKey) {
      await this.storage.delete(previous.objectKey);
    }

    return updated;
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { StoreObjectKeyPolicy } from '../../policies/store-object-key.policy';
import { ImageFileValidator } from '../../validators/image-file.validator';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface UploadStoreLogoInput {
  storeId: string;
  buffer: Buffer;
  declaredMimeType: string;
}

@Injectable()
export class UploadStoreLogoUseCase implements IUseCase<
  UploadStoreLogoInput,
  StoreSettingsEntity
> {
  constructor(
    private readonly repository: StoreSettingsRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: UploadStoreLogoInput): Promise<StoreSettingsEntity> {
    const mimeType = ImageFileValidator.validate(
      input.buffer,
      input.declaredMimeType,
    );

    const settings = await this.repository.getOrCreateDefault(input.storeId);

    if (settings.hasLogo()) {
      await this.storage.delete(settings.logoObjectKey!);
    }

    const key = StoreObjectKeyPolicy.logoKey(
      input.storeId,
      settings.name,
      mimeType,
    );
    await this.storage.put({ key, buffer: input.buffer, mimeType });

    settings.setLogo(key, mimeType);
    await this.repository.save(settings);
    return settings;
  }
}

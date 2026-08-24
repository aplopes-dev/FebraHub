import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface DeleteStoreLogoInput {
  storeId: string;
}

@Injectable()
export class DeleteStoreLogoUseCase implements IUseCase<
  DeleteStoreLogoInput,
  StoreSettingsEntity
> {
  constructor(
    private readonly repository: StoreSettingsRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: DeleteStoreLogoInput): Promise<StoreSettingsEntity> {
    const settings = await this.repository.getOrCreateDefault(input.storeId);
    if (settings.hasLogo()) {
      await this.storage.delete(settings.logoObjectKey!);
      settings.clearLogo();
      await this.repository.save(settings);
    }
    return settings;
  }
}

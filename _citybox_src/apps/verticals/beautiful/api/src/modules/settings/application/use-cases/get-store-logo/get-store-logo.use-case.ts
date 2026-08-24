import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { StoreSettingsNotFoundError } from '../../../domain/errors/store-settings-not-found.error';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface GetStoreLogoInput {
  storeId: string;
}

export interface GetStoreLogoOutput {
  buffer: Buffer;
  mimeType: string;
}

@Injectable()
export class GetStoreLogoUseCase implements IUseCase<
  GetStoreLogoInput,
  GetStoreLogoOutput
> {
  constructor(
    private readonly repository: StoreSettingsRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: GetStoreLogoInput): Promise<GetStoreLogoOutput> {
    const settings = await this.repository.getOrCreateDefault(input.storeId);
    if (!settings.hasLogo()) {
      throw new StoreSettingsNotFoundError('logo');
    }

    const object = await this.storage.get(settings.logoObjectKey!);
    return {
      buffer: object.buffer,
      mimeType: settings.logoMimeType ?? object.mimeType,
    };
  }
}

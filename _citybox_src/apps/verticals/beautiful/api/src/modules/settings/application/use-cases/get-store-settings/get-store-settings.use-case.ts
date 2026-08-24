import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface GetStoreSettingsInput {
  storeId: string;
}

@Injectable()
export class GetStoreSettingsUseCase implements IUseCase<
  GetStoreSettingsInput,
  StoreSettingsEntity
> {
  constructor(private readonly repository: StoreSettingsRepository) {}

  async execute(input: GetStoreSettingsInput): Promise<StoreSettingsEntity> {
    return this.repository.getOrCreateDefault(input.storeId);
  }
}

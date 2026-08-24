import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export type GetStoreSettingsInput = {
  storeId: string;
};

/**
 * Get-or-create: a primeira leitura persiste a linha com os padrões, para que
 * o web sempre trabalhe sobre um registro real da loja.
 */
@Injectable()
export class GetStoreSettingsUseCase implements IUseCase<
  GetStoreSettingsInput,
  StoreSettingsEntity
> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(input: GetStoreSettingsInput): Promise<StoreSettingsEntity> {
    const existing = await this.settings.findByStoreId(input.storeId);
    if (existing) return existing;

    const defaults = StoreSettingsEntity.default(input.storeId);
    return this.settings.upsert(input.storeId, {
      system: defaults.system,
      notifications: defaults.notifications,
      integrations: defaults.integrations,
    });
  }
}

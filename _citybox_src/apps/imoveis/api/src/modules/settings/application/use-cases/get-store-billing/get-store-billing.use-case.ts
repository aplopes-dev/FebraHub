import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export type GetStoreBillingInput = {
  storeId: string;
};

/** Get-or-create: os campos de cobrança vivem na mesma linha de `store_settings`. */
@Injectable()
export class GetStoreBillingUseCase implements IUseCase<
  GetStoreBillingInput,
  StoreSettingsEntity
> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(input: GetStoreBillingInput): Promise<StoreSettingsEntity> {
    const existing = await this.settings.findByStoreId(input.storeId);
    if (existing) return existing;

    const defaults = StoreSettingsEntity.default(input.storeId);
    return this.settings.updateBilling(input.storeId, defaults.billing);
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  cloneIntegrationSettings,
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  type StoreNotificationSettings,
  type StoreSettingsEntity,
} from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export type PutStoreNotificationsInput = {
  storeId: string;
  notifications: StoreNotificationSettings;
};

/**
 * Atualiza só as preferências de notificação da loja — qualquer membro com
 * acesso à loja (escopo) pode chamar. Sistema/integrações exigem Settings.
 */
@Injectable()
export class PutStoreNotificationsUseCase implements IUseCase<
  PutStoreNotificationsInput,
  StoreSettingsEntity
> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(
    input: PutStoreNotificationsInput,
  ): Promise<StoreSettingsEntity> {
    const existing = await this.settings.findByStoreId(input.storeId);

    return this.settings.upsert(input.storeId, {
      system: existing?.system ?? { ...DEFAULT_SYSTEM_SETTINGS },
      notifications: { ...input.notifications },
      integrations: cloneIntegrationSettings(
        existing?.integrations ?? DEFAULT_INTEGRATION_SETTINGS,
      ),
    });
  }
}

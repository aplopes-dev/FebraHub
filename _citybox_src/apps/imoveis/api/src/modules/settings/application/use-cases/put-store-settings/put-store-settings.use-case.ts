import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  cloneIntegrationSettings,
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  isValidAccentColor,
  normalizeAccentColorId,
  type StoreIntegrationSettings,
  type StoreNotificationSettings,
  type StoreSettingsEntity,
  type StoreSystemSettings,
} from '../../../domain/entities/store-settings.entity';
import { InvalidAccentColorError } from '../../../domain/errors/invalid-accent-color.error';
import { parseIntegrationSettings } from '../../../domain/mappers/integration-settings.mapper';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export type PutStoreSettingsInput = {
  storeId: string;
  system: {
    companyName: string;
    timezone: string;
    currency: string;
    language: string;
    autoAssignLeads: boolean;
    requireTwoFactorForNewUsers: boolean;
    whatsappCatalogEnabled: boolean;
    leadFormCatalogEnabled: boolean;
    accentColorId: string;
  };
  notifications: StoreNotificationSettings;
  /** Omitido = mantém as integrações já gravadas (ou os padrões). */
  integrations?: unknown;
};

/** Campo em branco cai no padrão — o web nunca deve ficar sem fuso/moeda. */
function orDefault(value: string, fallback: string): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || fallback;
}

@Injectable()
export class PutStoreSettingsUseCase implements IUseCase<
  PutStoreSettingsInput,
  StoreSettingsEntity
> {
  constructor(private readonly settings: StoreSettingsRepository) {}

  async execute(input: PutStoreSettingsInput): Promise<StoreSettingsEntity> {
    const accentRaw = input.system.accentColorId?.trim() ?? '';
    if (!isValidAccentColor(accentRaw)) {
      throw new InvalidAccentColorError(
        PutStoreSettingsUseCase.name,
        input.system.accentColorId,
      );
    }
    const accentColorId = normalizeAccentColorId(accentRaw);

    const system: StoreSystemSettings = {
      companyName: input.system.companyName?.trim() ?? '',
      timezone: orDefault(
        input.system.timezone,
        DEFAULT_SYSTEM_SETTINGS.timezone,
      ),
      currency: orDefault(
        input.system.currency,
        DEFAULT_SYSTEM_SETTINGS.currency,
      ),
      language: orDefault(
        input.system.language,
        DEFAULT_SYSTEM_SETTINGS.language,
      ),
      autoAssignLeads: input.system.autoAssignLeads,
      requireTwoFactorForNewUsers: input.system.requireTwoFactorForNewUsers,
      whatsappCatalogEnabled: Boolean(input.system.whatsappCatalogEnabled),
      leadFormCatalogEnabled: Boolean(input.system.leadFormCatalogEnabled),
      accentColorId,
    };

    return this.settings.upsert(input.storeId, {
      system,
      notifications: { ...input.notifications },
      integrations: await this.resolveIntegrations(input),
    });
  }

  private async resolveIntegrations(
    input: PutStoreSettingsInput,
  ): Promise<StoreIntegrationSettings> {
    if (input.integrations !== undefined) {
      return parseIntegrationSettings(input.integrations);
    }
    const existing = await this.settings.findByStoreId(input.storeId);
    return cloneIntegrationSettings(
      existing?.integrations ?? DEFAULT_INTEGRATION_SETTINGS,
    );
  }
}

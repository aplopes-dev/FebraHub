import type {
  StoreBillingSettings,
  StoreIntegrationSettings,
  StoreNotificationSettings,
  StoreSettingsEntity,
  StoreSystemSettings,
} from '../entities/store-settings.entity';

export type StoreSettingsUpsertPayload = {
  system: StoreSystemSettings;
  notifications: StoreNotificationSettings;
  integrations: StoreIntegrationSettings;
};

export abstract class StoreSettingsRepository {
  /** `null` quando a loja ainda não tem linha em `store_settings`. */
  abstract findByStoreId(storeId: string): Promise<StoreSettingsEntity | null>;

  /** Não toca nos campos de cobrança — eles têm rota própria. */
  abstract upsert(
    storeId: string,
    payload: StoreSettingsUpsertPayload,
  ): Promise<StoreSettingsEntity>;

  abstract updateBilling(
    storeId: string,
    billing: StoreBillingSettings,
  ): Promise<StoreSettingsEntity>;
}

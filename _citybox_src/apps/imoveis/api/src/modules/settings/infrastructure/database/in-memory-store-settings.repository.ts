import {
  cloneIntegrationSettings,
  DEFAULT_BILLING_SETTINGS,
  StoreSettingsEntity,
  type StoreBillingSettings,
} from '../../domain/entities/store-settings.entity';
import {
  StoreSettingsRepository,
  type StoreSettingsUpsertPayload,
} from '../../domain/repositories/store-settings.repository.interface';

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryStoreSettingsRepository extends StoreSettingsRepository {
  private readonly settings = new Map<string, StoreSettingsEntity>();

  async findByStoreId(storeId: string): Promise<StoreSettingsEntity | null> {
    await Promise.resolve();
    return this.settings.get(storeId) ?? null;
  }

  async upsert(
    storeId: string,
    payload: StoreSettingsUpsertPayload,
  ): Promise<StoreSettingsEntity> {
    await Promise.resolve();
    const existing = this.settings.get(storeId);
    const entity = StoreSettingsEntity.create(
      {
        storeId,
        system: { ...payload.system },
        notifications: { ...payload.notifications },
        integrations: cloneIntegrationSettings(payload.integrations),
        billing: existing?.billing ?? { ...DEFAULT_BILLING_SETTINGS },
      },
      existing?.id,
    );
    this.settings.set(storeId, entity);
    return entity;
  }

  async updateBilling(
    storeId: string,
    billing: StoreBillingSettings,
  ): Promise<StoreSettingsEntity> {
    await Promise.resolve();
    const existing = this.settings.get(storeId);
    const base = existing ?? StoreSettingsEntity.default(storeId);
    const entity = StoreSettingsEntity.create(
      { ...base.props, storeId, billing: { ...billing } },
      existing?.id,
    );
    this.settings.set(storeId, entity);
    return entity;
  }
}

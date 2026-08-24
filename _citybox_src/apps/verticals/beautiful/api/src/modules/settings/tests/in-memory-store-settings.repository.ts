import type { WorkIntervalRow } from '../../../shared/domain/work-schedule/work-schedule.types';
import { StoreSettingsEntity } from '../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../domain/repositories/store-settings.repository.interface';

export class InMemoryStoreSettingsRepository extends StoreSettingsRepository {
  private settingsByStoreId = new Map<string, StoreSettingsEntity>();
  private intervals = new Map<string, WorkIntervalRow[]>();

  getOrCreateDefault(storeId: string): Promise<StoreSettingsEntity> {
    const existing = this.settingsByStoreId.get(storeId);
    if (existing) {
      return Promise.resolve(existing);
    }

    const created = StoreSettingsEntity.create({
      storeId,
      name: 'Meu estabelecimento',
    });
    this.settingsByStoreId.set(storeId, created);
    return Promise.resolve(created);
  }

  save(settings: StoreSettingsEntity): Promise<void> {
    this.settingsByStoreId.set(settings.storeId, settings);
    return Promise.resolve();
  }

  findWorkIntervals(storeSettingsId: string): Promise<WorkIntervalRow[]> {
    return Promise.resolve(this.intervals.get(storeSettingsId) ?? []);
  }

  replaceWorkIntervals(
    storeSettingsId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void> {
    this.intervals.set(storeSettingsId, intervals);
    return Promise.resolve();
  }
}

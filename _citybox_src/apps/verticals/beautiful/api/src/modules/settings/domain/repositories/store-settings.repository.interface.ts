import type { WorkIntervalRow } from '../../../../shared/domain/work-schedule/work-schedule.types';
import { StoreSettingsEntity } from '../entities/store-settings.entity';

export abstract class StoreSettingsRepository {
  abstract getOrCreateDefault(storeId: string): Promise<StoreSettingsEntity>;
  abstract save(settings: StoreSettingsEntity): Promise<void>;
  abstract findWorkIntervals(
    storeSettingsId: string,
  ): Promise<WorkIntervalRow[]>;
  abstract replaceWorkIntervals(
    storeSettingsId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void>;
}

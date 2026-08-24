import type { StoreSetupLog } from '../entities/store-setup-log.entity';

export abstract class StoreSetupLogRepository {
  abstract findByStoreId(storeId: string): Promise<StoreSetupLog | null>;
  abstract save(log: StoreSetupLog): Promise<StoreSetupLog>;
}

import type { StoreSetupLog } from '../domain/entities/store-setup-log.entity';
import { StoreSetupLogRepository } from '../domain/repositories/store-setup-log.repository.interface';

export class InMemoryStoreSetupLogRepository extends StoreSetupLogRepository {
  private logs = new Map<string, StoreSetupLog>();

  findByStoreId(storeId: string): Promise<StoreSetupLog | null> {
    return Promise.resolve(this.logs.get(storeId) ?? null);
  }

  save(log: StoreSetupLog): Promise<StoreSetupLog> {
    this.logs.set(log.storeId, log);
    return Promise.resolve(log);
  }

  clear(): void {
    this.logs.clear();
  }
}

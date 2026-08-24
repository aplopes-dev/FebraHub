import type { ClinicStore } from '../domain/entities/clinic-store.entity';
import { ClinicStoreRepository } from '../domain/repositories/clinic-store.repository.interface';

export class InMemoryClinicStoreRepository extends ClinicStoreRepository {
  private stores = new Map<string, ClinicStore>();

  findById(storeId: string): Promise<ClinicStore | null> {
    return Promise.resolve(this.stores.get(storeId) ?? null);
  }

  save(store: ClinicStore): Promise<ClinicStore> {
    this.stores.set(store.storeId, store);
    return Promise.resolve(store);
  }

  getAll(): ClinicStore[] {
    return [...this.stores.values()];
  }

  clear(): void {
    this.stores.clear();
  }
}

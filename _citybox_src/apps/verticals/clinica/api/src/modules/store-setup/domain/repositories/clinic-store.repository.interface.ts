import type { ClinicStore } from '../entities/clinic-store.entity';

export abstract class ClinicStoreRepository {
  abstract findById(storeId: string): Promise<ClinicStore | null>;
  abstract save(store: ClinicStore): Promise<ClinicStore>;
}

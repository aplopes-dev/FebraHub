import { ClinicStoreProfileRepository } from '../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicStoreProfile } from '../domain/entities/clinic-store-profile.entity';

export class InMemoryClinicStoreProfileRepository extends ClinicStoreProfileRepository {
  private items: ClinicStoreProfile[] = [];

  findByStoreId(storeId: string): Promise<ClinicStoreProfile | null> {
    return Promise.resolve(
      this.items.find((p) => p.storeId === storeId) ?? null,
    );
  }

  save(profile: ClinicStoreProfile): Promise<ClinicStoreProfile> {
    const index = this.items.findIndex(
      (item) => item.storeId === profile.storeId,
    );
    if (index >= 0) this.items[index] = profile;
    else this.items.push(profile);
    return Promise.resolve(profile);
  }

  clear(): void {
    this.items = [];
  }
}

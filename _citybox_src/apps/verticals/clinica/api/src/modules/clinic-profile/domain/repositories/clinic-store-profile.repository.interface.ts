import type { ClinicStoreProfile } from '../entities/clinic-store-profile.entity';

export abstract class ClinicStoreProfileRepository {
  abstract findByStoreId(storeId: string): Promise<ClinicStoreProfile | null>;
  abstract save(profile: ClinicStoreProfile): Promise<ClinicStoreProfile>;
}

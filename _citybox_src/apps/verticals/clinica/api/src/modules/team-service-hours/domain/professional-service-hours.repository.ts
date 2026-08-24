import type { ServiceHoursConfig } from '../domain/service-hours.types';

export abstract class ProfessionalServiceHoursRepository {
  abstract findByMember(
    storeId: string,
    memberId: string,
  ): Promise<ServiceHoursConfig | null>;

  abstract upsert(
    storeId: string,
    memberId: string,
    config: ServiceHoursConfig,
  ): Promise<ServiceHoursConfig>;
}

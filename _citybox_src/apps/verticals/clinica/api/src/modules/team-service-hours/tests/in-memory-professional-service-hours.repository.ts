import type { ServiceHoursConfig } from '../domain/service-hours.types';
import { ProfessionalServiceHoursRepository } from '../domain/professional-service-hours.repository';

export class InMemoryProfessionalServiceHoursRepository extends ProfessionalServiceHoursRepository {
  private readonly rows = new Map<string, ServiceHoursConfig>();

  private key(storeId: string, memberId: string): string {
    return `${storeId}:${memberId}`;
  }

  async findByMember(
    storeId: string,
    memberId: string,
  ): Promise<ServiceHoursConfig | null> {
    return this.rows.get(this.key(storeId, memberId)) ?? null;
  }

  async upsert(
    storeId: string,
    memberId: string,
    config: ServiceHoursConfig,
  ): Promise<ServiceHoursConfig> {
    this.rows.set(this.key(storeId, memberId), structuredClone(config));
    return structuredClone(config);
  }

  getAll(): Map<string, ServiceHoursConfig> {
    return this.rows;
  }
}

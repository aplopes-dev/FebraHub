import type { Clinic } from '../domain/entities/clinic.entity';
import type { Organization } from '../domain/entities/organization.entity';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../domain/repositories/tenancy.repositories';

export class InMemoryOrganizationRepository extends OrganizationRepository {
  readonly items: Organization[] = [];

  async findByStoreId(storeId: string): Promise<Organization | null> {
    return this.items.find((o) => o.storeId === storeId) ?? null;
  }
  async findById(id: string): Promise<Organization | null> {
    return this.items.find((o) => o.id === id) ?? null;
  }
  async findByClinicId(): Promise<Organization | null> {
    return this.items[0] ?? null;
  }
  async save(organization: Organization): Promise<Organization> {
    const i = this.items.findIndex((o) => o.id === organization.id);
    if (i >= 0) this.items[i] = organization;
    else this.items.push(organization);
    return organization;
  }
}

export class InMemoryClinicRepository extends ClinicRepository {
  readonly items: Clinic[] = [];

  async findById(id: string): Promise<Clinic | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }
  async findByOrganizationId(organizationId: string): Promise<Clinic[]> {
    return this.items.filter((c) => c.organizationId === organizationId);
  }
  async countActiveByOrganizationId(organizationId: string): Promise<number> {
    return this.items.filter(
      (c) => c.organizationId === organizationId && c.status === 'active',
    ).length;
  }
  async findBySlug(organizationId: string, slug: string): Promise<Clinic | null> {
    return (
      this.items.find(
        (c) => c.organizationId === organizationId && c.slug === slug,
      ) ?? null
    );
  }
  async save(clinic: Clinic): Promise<Clinic> {
    const i = this.items.findIndex((c) => c.id === clinic.id);
    if (i >= 0) this.items[i] = clinic;
    else this.items.push(clinic);
    return clinic;
  }
}

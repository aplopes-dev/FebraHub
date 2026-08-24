import type { Clinic } from '../entities/clinic.entity';
import type { Organization } from '../entities/organization.entity';

export abstract class OrganizationRepository {
  abstract findByStoreId(storeId: string): Promise<Organization | null>;
  abstract findById(id: string): Promise<Organization | null>;
  /** Resolve a organização a partir de uma clínica — usado pelo guard de escopo. */
  abstract findByClinicId(clinicId: string): Promise<Organization | null>;
  abstract save(organization: Organization): Promise<Organization>;
}

export abstract class ClinicRepository {
  abstract findById(id: string): Promise<Clinic | null>;
  abstract findByOrganizationId(organizationId: string): Promise<Clinic[]>;
  abstract countActiveByOrganizationId(organizationId: string): Promise<number>;
  abstract findBySlug(organizationId: string, slug: string): Promise<Clinic | null>;
  abstract save(clinic: Clinic): Promise<Clinic>;
}

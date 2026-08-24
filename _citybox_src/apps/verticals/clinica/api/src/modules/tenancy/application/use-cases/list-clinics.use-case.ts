import { Injectable } from '@nestjs/common';
import type { Clinic } from '../../domain/entities/clinic.entity';
import type { Organization } from '../../domain/entities/organization.entity';
import { OrganizationNotFoundError } from '../../domain/errors/tenancy.errors';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../../domain/repositories/tenancy.repositories';

export type ListClinicsResult = {
  organization: Organization;
  clinics: Clinic[];
  /** Quanto ainda cabe no plano. `null` = plano ainda não sincronizado. */
  remainingSlots: number | null;
};

@Injectable()
export class ListClinicsUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly clinics: ClinicRepository,
  ) {}

  async execute(storeId: string): Promise<ListClinicsResult> {
    const organization = await this.organizations.findByStoreId(storeId);
    if (!organization) {
      throw new OrganizationNotFoundError(ListClinicsUseCase.name, storeId);
    }

    const clinics = await this.clinics.findByOrganizationId(organization.id);
    const active = clinics.filter((c) => c.status === 'active').length;
    const max = organization.plan.maxClinics;

    return {
      organization,
      clinics,
      remainingSlots: max === null ? null : Math.max(0, max - active),
    };
  }
}

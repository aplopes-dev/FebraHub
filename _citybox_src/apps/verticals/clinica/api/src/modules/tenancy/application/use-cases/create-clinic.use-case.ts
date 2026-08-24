import { Injectable } from '@nestjs/common';
import { Clinic } from '../../domain/entities/clinic.entity';
import {
  ClinicQuotaExceededError,
  ClinicSlugTakenError,
  OrganizationNotFoundError,
  OrganizationSuspendedError,
} from '../../domain/errors/tenancy.errors';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../../domain/repositories/tenancy.repositories';

export type CreateClinicInput = {
  storeId: string;
  name: string;
  slug?: string;
  legalName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  timezone?: string;
};

export function slugifyClinicName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CreateClinicUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly clinics: ClinicRepository,
  ) {}

  async execute(input: CreateClinicInput): Promise<Clinic> {
    const organization = await this.organizations.findByStoreId(input.storeId);
    if (!organization) {
      throw new OrganizationNotFoundError(CreateClinicUseCase.name, input.storeId);
    }
    if (!organization.isActive) {
      throw new OrganizationSuspendedError(CreateClinicUseCase.name, input.storeId);
    }

    // Quota validada **localmente** contra o snapshot do plano — sem round-trip ao
    // platform-api. É o que permite a vertical operar mesmo com o platform fora do ar.
    const active = await this.clinics.countActiveByOrganizationId(organization.id);
    if (!organization.canCreateClinic(active)) {
      throw new ClinicQuotaExceededError(
        CreateClinicUseCase.name,
        active,
        organization.plan.maxClinics ?? active,
      );
    }

    const slug = input.slug?.trim() || slugifyClinicName(input.name);
    const taken = await this.clinics.findBySlug(organization.id, slug);
    if (taken) {
      throw new ClinicSlugTakenError(CreateClinicUseCase.name, slug);
    }

    const clinic = Clinic.create({
      organizationId: organization.id,
      name: input.name.trim(),
      slug,
      isRoot: false,
      status: 'active',
      legalName: input.legalName ?? null,
      document: input.document ?? null,
      stateRegistration: input.stateRegistration ?? null,
      zipCode: input.zipCode ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      phone: input.phone ?? null,
      timezone: input.timezone ?? 'America/Sao_Paulo',
    });

    return this.clinics.save(clinic);
  }
}

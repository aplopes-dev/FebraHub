import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  DEFAULT_CLINIC_STRAND,
  isClinicStrand,
  type ClinicStrand,
} from '@citybox/messaging';
import { Clinic, type ClinicProps } from '../../domain/entities/clinic.entity';
import {
  Organization,
  type OrganizationProps,
} from '../../domain/entities/organization.entity';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../../domain/repositories/tenancy.repositories';

type OrganizationRow = {
  id: string;
  storeId: string;
  name: string;
  status: string;
  clinicStrand: string;
  planId: string | null;
  planTier: string | null;
  planMaxClinics: number | null;
  planMaxUsers: number | null;
  overQuota: boolean;
  suspendedReason: string | null;
  platformUpdatedAt: Date | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function hydrateClinicStrand(value: string): ClinicStrand {
  return isClinicStrand(value) ? value : DEFAULT_CLINIC_STRAND;
}

function toOrganization(row: OrganizationRow): Organization {
  const props: OrganizationProps = {
    storeId: row.storeId,
    name: row.name,
    status: row.status as OrganizationProps['status'],
    clinicStrand: hydrateClinicStrand(row.clinicStrand),
    plan: {
      planId: row.planId,
      tier: row.planTier,
      maxClinics: row.planMaxClinics,
      maxUsers: row.planMaxUsers,
    },
    overQuota: row.overQuota,
    suspendedReason: row.suspendedReason,
    platformUpdatedAt: row.platformUpdatedAt,
    syncedAt: row.syncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return Organization.with(props, row.id);
}

@Injectable()
export class PrismaOrganizationRepository extends OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({ where: { storeId } });
    return row ? toOrganization(row) : null;
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? toOrganization(row) : null;
  }

  async findByClinicId(clinicId: string): Promise<Organization | null> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { organization: true },
    });
    return clinic?.organization ? toOrganization(clinic.organization) : null;
  }

  async save(organization: Organization): Promise<Organization> {
    const data = {
      storeId: organization.storeId,
      name: organization.name,
      status: organization.status,
      planId: organization.plan.planId,
      planTier: organization.plan.tier,
      planMaxClinics: organization.plan.maxClinics,
      planMaxUsers: organization.plan.maxUsers,
      overQuota: organization.overQuota,
      suspendedReason: organization.suspendedReason,
      platformUpdatedAt: organization.props.platformUpdatedAt,
      syncedAt: organization.props.syncedAt,
    };
    const row = await this.prisma.organization.upsert({
      where: { id: organization.id },
      create: {
        id: organization.id,
        ...data,
        clinicStrand: organization.clinicStrand,
      },
      update: data,
    });
    return toOrganization(row);
  }
}

type ClinicRow = ClinicProps & { id: string };

function toClinic(row: ClinicRow): Clinic {
  return Clinic.with(
    {
      organizationId: row.organizationId,
      name: row.name,
      slug: row.slug,
      isRoot: row.isRoot,
      status: row.status,
      legalName: row.legalName,
      document: row.document,
      stateRegistration: row.stateRegistration,
      zipCode: row.zipCode,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      phone: row.phone,
      timezone: row.timezone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    row.id,
  );
}

@Injectable()
export class PrismaClinicRepository extends ClinicRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({ where: { id } });
    return row ? toClinic(row as ClinicRow) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Clinic[]> {
    const rows = await this.prisma.clinic.findMany({
      where: { organizationId },
      orderBy: [{ isRoot: 'desc' }, { name: 'asc' }],
    });
    return rows.map((row) => toClinic(row as ClinicRow));
  }

  async countActiveByOrganizationId(organizationId: string): Promise<number> {
    return this.prisma.clinic.count({
      where: { organizationId, status: 'active' },
    });
  }

  async findBySlug(organizationId: string, slug: string): Promise<Clinic | null> {
    const row = await this.prisma.clinic.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    });
    return row ? toClinic(row as ClinicRow) : null;
  }

  async save(clinic: Clinic): Promise<Clinic> {
    const data = {
      organizationId: clinic.organizationId,
      name: clinic.name,
      slug: clinic.slug,
      isRoot: clinic.isRoot,
      status: clinic.status,
      legalName: clinic.props.legalName,
      document: clinic.props.document,
      stateRegistration: clinic.props.stateRegistration,
      zipCode: clinic.props.zipCode,
      street: clinic.props.street,
      number: clinic.props.number,
      complement: clinic.props.complement,
      neighborhood: clinic.props.neighborhood,
      city: clinic.props.city,
      state: clinic.props.state,
      phone: clinic.props.phone,
      timezone: clinic.timezone,
    };
    const row = await this.prisma.clinic.upsert({
      where: { id: clinic.id },
      create: { id: clinic.id, ...data },
      update: data,
    });
    return toClinic(row as ClinicRow);
  }
}

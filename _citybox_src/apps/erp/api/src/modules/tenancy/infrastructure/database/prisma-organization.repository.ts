import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import {
  SYSTEM_PERMISSION_PROFILES,
  SYSTEM_PROFILE_ADMINISTRADOR,
} from '../../../../shared/infra/http/permissions/fine-to-coarse';
import {
  Organization,
  type OrganizationProps,
  type OrganizationStatusValue,
} from '../../domain/entities/organization.entity';
import { Membership } from '../../domain/entities/membership.entity';
import {
  OrganizationRepository,
  type OrganizationSummary,
} from '../../domain/repositories/organization.repository.interface';
import { toMembershipEntity } from './membership.mapper';

type OrganizationRow = {
  id: string;
  personType: string;
  document: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  phone: string | null;
  responsibleName: string;
  responsibleDocument: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  status: string;
  platformStoreId: string | null;
  planId: string | null;
  planTier: string | null;
  planMaxBranches: number | null;
  planMaxUsers: number | null;
  suspendedReason: string | null;
  platformUpdatedAt: Date | null;
  syncedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * `Organization` é o próprio tenant, então este repositório usa o cliente cru:
 * não há `organizationId` para o filtro global recortar (ver
 * `tenant-scope.extension.ts`).
 */
@Injectable()
export class PrismaOrganizationRepository extends OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(document: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({
      where: { document },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByPlatformStoreId(
    platformStoreId: string,
  ): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({
      where: { platformStoreId },
    });
    return row ? this.toEntity(row) : null;
  }

  async createWithOwner(
    organization: Organization,
    ownerUserId: string,
  ): Promise<{ organization: Organization; membership: Membership }> {
    // Transação porque uma organização sem responsável é inacessível: ninguém
    // conseguiria nem listá-la para consertar. Os perfis de sistema nascem
    // junto — o OWNER já entra no perfil `administrador`.
    const result = await this.prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: this.toCreateData(organization),
      });

      const now = new Date();
      let adminProfileId: string | null = null;

      for (const seed of SYSTEM_PERMISSION_PROFILES) {
        const profile = await tx.permissionProfile.upsert({
          where: {
            organizationId_systemKey: {
              organizationId: createdOrganization.id,
              systemKey: seed.systemKey,
            },
          },
          create: {
            organizationId: createdOrganization.id,
            name: seed.name,
            description: seed.description,
            isSystem: seed.isSystem,
            systemKey: seed.systemKey,
            permissionIds: seed.permissionIds,
            updatedAt: now,
          },
          update: {
            name: seed.name,
            description: seed.description,
            permissionIds: seed.permissionIds,
            isSystem: seed.isSystem,
            deletedAt: null,
            updatedAt: now,
          },
        });

        if (seed.systemKey === SYSTEM_PROFILE_ADMINISTRADOR) {
          adminProfileId = profile.id;
        }
      }

      const createdMembership = await tx.membership.create({
        data: {
          organizationId: createdOrganization.id,
          userId: ownerUserId,
          role: 'OWNER',
          permissionProfileId: adminProfileId,
          active: true,
          updatedAt: now,
        },
      });

      return { createdOrganization, createdMembership };
    });

    return {
      organization: this.toEntity(result.createdOrganization),
      membership: toMembershipEntity(result.createdMembership),
    };
  }

  async save(organization: Organization): Promise<Organization> {
    const data = {
      personType: organization.personType,
      document: organization.document,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      email: organization.email,
      phone: organization.phone,
      responsibleName: organization.responsibleName,
      responsibleDocument: organization.responsibleDocument,
      responsibleEmail: organization.responsibleEmail,
      responsiblePhone: organization.responsiblePhone,
      status: organization.status,
      platformStoreId: organization.platformStoreId,
      planId: organization.planId,
      planTier: organization.planTier,
      planMaxBranches: organization.planMaxBranches,
      planMaxUsers: organization.planMaxUsers,
      suspendedReason: organization.suspendedReason,
      platformUpdatedAt: organization.platformUpdatedAt,
      syncedAt: organization.syncedAt,
      deletedAt: organization.deletedAt,
      updatedAt: organization.updatedAt,
    };

    const row = await this.prisma.organization.upsert({
      where: { id: organization.id },
      create: {
        id: organization.id,
        ...data,
        createdAt: organization.createdAt,
      },
      update: data,
    });

    return this.toEntity(row);
  }

  /**
   * Consulta deliberadamente cross-tenant: é o seletor de empresa, que roda
   * antes de existir organização ativa. Usa o cliente cru pelo mesmo motivo.
   */
  async findAllByUser(userId: string): Promise<OrganizationSummary[]> {
    const rows = await this.prisma.membership.findMany({
      where: { userId, active: true, organization: { deletedAt: null } },
      include: {
        organization: {
          include: {
            _count: { select: { branches: { where: { deletedAt: null } } } },
          },
        },
      },
      orderBy: { organization: { legalName: 'asc' } },
    });

    return rows.map((row) => ({
      organization: this.toEntity(row.organization),
      role: row.role,
      branchCount: row.organization._count.branches,
    }));
  }

  private toCreateData(organization: Organization) {
    return {
      id: organization.id,
      personType: organization.personType,
      document: organization.document,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      email: organization.email,
      phone: organization.phone,
      responsibleName: organization.responsibleName,
      responsibleDocument: organization.responsibleDocument,
      responsibleEmail: organization.responsibleEmail,
      responsiblePhone: organization.responsiblePhone,
      status: organization.status,
      platformStoreId: organization.platformStoreId,
      planId: organization.planId,
      planTier: organization.planTier,
      planMaxBranches: organization.planMaxBranches,
      planMaxUsers: organization.planMaxUsers,
      suspendedReason: organization.suspendedReason,
      platformUpdatedAt: organization.platformUpdatedAt,
      syncedAt: organization.syncedAt,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  private toEntity(row: OrganizationRow): Organization {
    const props: OrganizationProps = {
      personType: row.personType as PersonTypeValue,
      document: row.document,
      legalName: row.legalName,
      tradeName: row.tradeName,
      email: row.email,
      phone: row.phone,
      responsibleName: row.responsibleName,
      responsibleDocument: row.responsibleDocument,
      responsibleEmail: row.responsibleEmail,
      responsiblePhone: row.responsiblePhone,
      status: row.status as OrganizationStatusValue,
      platformStoreId: row.platformStoreId,
      planId: row.planId,
      planTier: row.planTier,
      planMaxBranches: row.planMaxBranches,
      planMaxUsers: row.planMaxUsers,
      suspendedReason: row.suspendedReason,
      platformUpdatedAt: row.platformUpdatedAt,
      syncedAt: row.syncedAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Organization.with(props, row.id);
  }
}

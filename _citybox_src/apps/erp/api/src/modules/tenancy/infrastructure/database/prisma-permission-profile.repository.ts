import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PermissionProfile,
  type PermissionProfileProps,
} from '../../domain/entities/permission-profile.entity';
import {
  PermissionProfileRepository,
  type PermissionProfileListCriteria,
  type PermissionProfileListFilters,
} from '../../domain/repositories/permission-profile.repository.interface';

type PermissionProfileRow = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  systemKey: string | null;
  permissionIds: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto.
 */
@Injectable()
export class PrismaPermissionProfileRepository extends PermissionProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PermissionProfile | null> {
    const row = await this.prisma.scoped.permissionProfile.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySystemKey(
    organizationId: string,
    systemKey: string,
  ): Promise<PermissionProfile | null> {
    const row = await this.prisma.scoped.permissionProfile.findFirst({
      where: { organizationId, systemKey, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: PermissionProfileListCriteria,
  ): Promise<PermissionProfile[]> {
    const rows = await this.prisma.scoped.permissionProfile.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      skip: (criteria.page - 1) * criteria.perPage,
      take: criteria.perPage,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    filters: PermissionProfileListFilters,
  ): Promise<number> {
    return this.prisma.scoped.permissionProfile.count({
      where: this.buildWhere(organizationId, filters),
    });
  }

  countMembershipsUsing(
    organizationId: string,
    profileId: string,
  ): Promise<number> {
    return this.prisma.scoped.membership.count({
      where: { organizationId, permissionProfileId: profileId },
    });
  }

  async save(profile: PermissionProfile): Promise<PermissionProfile> {
    const data = {
      organizationId: profile.organizationId,
      name: profile.name,
      description: profile.description,
      isSystem: profile.isSystem,
      systemKey: profile.systemKey,
      permissionIds: profile.permissionIds,
      deletedAt: profile.deletedAt,
      updatedAt: profile.updatedAt,
    };

    const row = await this.prisma.scoped.permissionProfile.upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        ...data,
        createdAt: profile.createdAt,
      },
      update: data,
    });

    return this.toEntity(row);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.permissionProfile.updateMany({
      where: { id, organizationId },
      data: { deletedAt, updatedAt: deletedAt },
    });
  }

  private buildWhere(
    organizationId: string,
    filters: PermissionProfileListFilters,
  ): Prisma.PermissionProfileWhereInput {
    const and: Prisma.PermissionProfileWhereInput[] = [];
    const search = filters.search?.trim();

    if (filters.activeOnly) {
      and.push({ deletedAt: null });
    }

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return and.length > 0 ? { organizationId, AND: and } : { organizationId };
  }

  private toEntity(row: PermissionProfileRow): PermissionProfile {
    const props: PermissionProfileProps = {
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      isSystem: row.isSystem,
      systemKey: row.systemKey,
      permissionIds: row.permissionIds,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PermissionProfile.with(props, row.id);
  }
}

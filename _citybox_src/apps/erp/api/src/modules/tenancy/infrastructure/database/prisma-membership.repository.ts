import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { Membership } from '../../domain/entities/membership.entity';
import {
  MembershipRepository,
  type MembershipDetail,
  type MembershipListCriteria,
  type MembershipPermissionProfileSummary,
} from '../../domain/repositories/membership.repository.interface';
import {
  toMembershipEntity,
  toUserEntity,
  type MembershipRow,
  type PermissionProfileSummaryRow,
  type UserRow,
} from './membership.mapper';

type MembershipWithRelations = MembershipRow & {
  user: UserRow;
  branchAccess: Array<{ branchId: string }>;
  permissionProfile: PermissionProfileSummaryRow | null;
};

type MembershipWhere = {
  organizationId: string;
  active?: boolean;
  isSeller?: boolean;
  user?: {
    OR: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
  };
};

const PROFILE_SELECT = {
  id: true,
  name: true,
  systemKey: true,
  permissionIds: true,
} as const;

const DETAIL_INCLUDE = {
  user: true,
  branchAccess: { select: { branchId: true } },
  permissionProfile: { select: PROFILE_SELECT },
} as const;

@Injectable()
export class PrismaMembershipRepository extends MembershipRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<MembershipDetail | null> {
    const row = await this.prisma.scoped.membership.findFirst({
      where: { id, organizationId },
      include: DETAIL_INCLUDE,
    });
    return row ? this.toDetail(row) : null;
  }

  async findByUser(
    organizationId: string,
    userId: string,
  ): Promise<Membership | null> {
    const row = await this.prisma.scoped.membership.findFirst({
      where: { organizationId, userId },
    });
    return row ? toMembershipEntity(row) : null;
  }

  async findByPdvCode(
    organizationId: string,
    code: string,
  ): Promise<MembershipDetail | null> {
    const normalized = code.trim();
    if (!normalized) return null;
    const row = await this.prisma.scoped.membership.findFirst({
      where: {
        organizationId,
        pdvCode: normalized,
        active: true,
        pdvPinHash: { not: null },
      },
      include: DETAIL_INCLUDE,
    });
    return row ? this.toDetail(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: MembershipListCriteria = {},
  ): Promise<MembershipDetail[]> {
    const rows = await this.prisma.scoped.membership.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: DETAIL_INCLUDE,
      // Responsáveis primeiro: é quem a tela de equipe precisa mostrar no topo.
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toDetail(row));
  }

  count(
    organizationId: string,
    criteria: MembershipListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.membership.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  countActiveOwners(organizationId: string): Promise<number> {
    return this.prisma.scoped.membership.count({
      where: { organizationId, role: 'OWNER', active: true },
    });
  }

  async findActiveOwner(
    organizationId: string,
  ): Promise<MembershipDetail | null> {
    const row = await this.prisma.scoped.membership.findFirst({
      where: { organizationId, role: 'OWNER', active: true },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return row ? this.toDetail(row) : null;
  }

  async save(membership: Membership): Promise<Membership> {
    const data = {
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      permissionProfileId: membership.permissionProfileId,
      active: membership.active,
      isSeller: membership.isSeller,
      pdvCode: membership.pdvCode,
      pdvPinHash: membership.pdvPinHash,
      pdvPinUpdatedAt: membership.pdvPinUpdatedAt,
      pdvFailedAttempts: membership.pdvFailedAttempts,
      pdvLockedUntil: membership.pdvLockedUntil,
      updatedAt: membership.updatedAt,
    };

    const row = await this.prisma.scoped.membership.upsert({
      where: { id: membership.id },
      create: { id: membership.id, ...data, createdAt: membership.createdAt },
      update: data,
    });

    return toMembershipEntity(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    // `deleteMany` e não `delete`: sem linha correspondente ele não lança, o
    // que mantém a remoção idempotente. O `BranchAccess` cai por cascade.
    await this.prisma.scoped.membership.deleteMany({
      where: { id, organizationId },
    });
  }

  async replaceBranchAccess(
    organizationId: string,
    membershipId: string,
    branchIds: string[],
  ): Promise<void> {
    const unique = [...new Set(branchIds)];

    // Substituir em transação: entre o apagar e o gravar, o membro ficaria sem
    // acesso nenhum para qualquer requisição concorrente.
    //
    // A transação usa o cliente cru (a extensão não atravessa transação
    // interativa), então o `organizationId` no `where` do delete é a trava —
    // é o único caminho de escrita do módulo sem o filtro global por trás.
    await this.prisma.$transaction(async (tx) => {
      await tx.branchAccess.deleteMany({
        where: { membershipId, organizationId },
      });
      if (unique.length === 0) return;

      await tx.branchAccess.createMany({
        data: unique.map((branchId) => ({
          organizationId,
          membershipId,
          branchId,
        })),
        skipDuplicates: true,
      });
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: MembershipListCriteria,
  ): MembershipWhere {
    const search = criteria.search?.trim();
    const where: MembershipWhere = { organizationId };

    if (criteria.activeOnly) where.active = true;
    if (criteria.isSeller !== undefined) where.isSeller = criteria.isSeller;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return where;
  }

  private toDetail(row: MembershipWithRelations): MembershipDetail {
    const permissionProfile: MembershipPermissionProfileSummary | null =
      row.permissionProfile
        ? {
            id: row.permissionProfile.id,
            name: row.permissionProfile.name,
            systemKey: row.permissionProfile.systemKey,
            permissionIds: row.permissionProfile.permissionIds,
          }
        : null;

    return {
      membership: toMembershipEntity(row),
      user: toUserEntity(row.user),
      branchIds: row.branchAccess.map((access) => access.branchId),
      permissionProfile,
    };
  }
}

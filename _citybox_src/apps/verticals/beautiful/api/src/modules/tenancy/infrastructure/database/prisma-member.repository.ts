import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { WorkIntervalRow } from '../../../../shared/domain/work-schedule/work-schedule.types';
import { SCHEDULABLE_STORE_ROLES } from '../../domain/store-role.catalog';
import {
  MemberRepository,
  type CreateMemberData,
  type ListMembersFilter,
  type ListWorkIntervalsFilter,
  type MemberRecord,
  type ReplaceStoreMembershipPatch,
  type UpdateMemberProfilePatch,
  type WorkIntervalRowWithMember,
} from '../../domain/repositories/member.repository';
import type { OrganizationMemberRole } from '../../domain/organization-member-role';

type RowWithStores = {
  id: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  organizationRole: string;
  hasPassword: boolean;
  provisionalExpiresAt: Date | null;
  disabledAt: Date | null;
  storeMembers: Array<{
    storeId: string;
    role: string;
    permissions: unknown;
    store: { name: string };
  }>;
  memberServices?: Array<{
    serviceId: string;
    service: { id: string; name: string };
  }>;
};

function toRecord(row: RowWithStores): MemberRecord {
  const services = row.memberServices?.map((ms) => ({
    id: ms.service.id,
    name: ms.service.name,
  }));

  return {
    id: row.id,
    organizationId: row.organizationId,
    keycloakSub: row.keycloakSub,
    username: row.username,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    status: row.status as MemberRecord['status'],
    organizationRole: row.organizationRole as OrganizationMemberRole,
    hasPassword: row.hasPassword,
    provisionalExpiresAt: row.provisionalExpiresAt,
    disabledAt: row.disabledAt,
    memberships: row.storeMembers.map((m) => ({
      storeId: m.storeId,
      storeName: m.store.name,
      role: m.role,
      permissions: Array.isArray(m.permissions)
        ? (m.permissions as string[])
        : [],
    })),
    ...(services
      ? {
          serviceIds: services.map((s) => s.id),
          services,
        }
      : {}),
  };
}

const INCLUDE = {
  storeMembers: { include: { store: { select: { name: true } } } },
} as const;

const INCLUDE_WITH_SERVICES = {
  ...INCLUDE,
  memberServices: {
    include: {
      service: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class PrismaMemberRepository extends MemberRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row) : null;
  }

  async findByUsername(username: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { username, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row) : null;
  }

  async findByKeycloakSub(sub: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { keycloakSub: sub, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row) : null;
  }

  async findActiveOwnerByStoreId(
    storeId: string,
  ): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: {
        deletedAt: null,
        status: 'active',
        organizationRole: 'OWNER',
        storeMembers: { some: { storeId } },
      },
      include: INCLUDE,
    });
    return row ? toRecord(row) : null;
  }

  async create(data: CreateMemberData): Promise<MemberRecord> {
    const row = await this.prisma.member.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        organizationId: data.organizationId,
        keycloakSub: data.keycloakSub,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        hasPassword: data.hasPassword,
        ...(data.organizationRole
          ? { organizationRole: data.organizationRole }
          : {}),
        storeMembers: {
          create: data.stores.map((s) => ({
            storeId: s.storeId,
            role: s.role,
            permissions: s.permissions,
          })),
        },
      },
      include: INCLUDE_WITH_SERVICES,
    });
    return toRecord(row);
  }

  async linkKeycloak(
    id: string,
    patch: { keycloakSub: string; username: string; hasPassword: boolean },
  ): Promise<MemberRecord | null> {
    const row = await this.prisma.member.update({
      where: { id },
      data: {
        keycloakSub: patch.keycloakSub,
        username: patch.username,
        hasPassword: patch.hasPassword,
      },
      include: INCLUDE,
    });
    return toRecord(row);
  }

  async promoteToOwner(
    id: string,
    patch: { firstName: string; lastName: string; email: string | null },
  ): Promise<MemberRecord | null> {
    const existing = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!existing) return null;

    const row = await this.prisma.member.update({
      where: { id },
      data: {
        firstName: patch.firstName,
        lastName: patch.lastName,
        email: patch.email,
        organizationRole: 'OWNER',
        status: 'active',
        disabledAt: null,
        deletedAt: null,
      },
      include: INCLUDE,
    });

    return toRecord(row);
  }

  async markProvisionalPassword(id: string, expiresAt: Date): Promise<void> {
    await this.prisma.member.update({
      where: { id },
      data: { hasPassword: false, provisionalExpiresAt: expiresAt },
    });
  }

  async markPasswordSet(id: string): Promise<void> {
    await this.prisma.member.update({
      where: { id },
      data: { hasPassword: true, provisionalExpiresAt: null },
    });
  }

  async listByStoreId(
    storeId: string,
    filter?: ListMembersFilter,
  ): Promise<MemberRecord[]> {
    const storeMemberFilter: Prisma.StoreMemberWhereInput = {
      storeId,
    };

    if (filter?.role?.trim()) {
      storeMemberFilter.role = filter.role.trim().toLowerCase();
    } else if (filter?.schedulable === true) {
      storeMemberFilter.role = { in: [...SCHEDULABLE_STORE_ROLES] };
    }

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
      storeMembers: {
        some: storeMemberFilter,
      },
    };

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.search?.trim()) {
      const search = filter.search.trim();
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.member.findMany({
      where,
      include: INCLUDE_WITH_SERVICES,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return rows.map((row) => toRecord(row as RowWithStores));
  }

  async findInStore(
    storeId: string,
    memberId: string,
  ): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        deletedAt: null,
        storeMembers: { some: { storeId } },
      },
      include: INCLUDE_WITH_SERVICES,
    });
    return row ? toRecord(row) : null;
  }

  async findSchedulableByIds(
    storeId: string,
    ids: string[],
  ): Promise<MemberRecord[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.member.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        status: 'active',
        storeMembers: {
          some: {
            storeId,
            role: { in: [...SCHEDULABLE_STORE_ROLES] },
          },
        },
      },
      include: INCLUDE_WITH_SERVICES,
    });

    return rows.map((row) => toRecord(row as RowWithStores));
  }

  async updateProfile(
    memberId: string,
    patch: UpdateMemberProfilePatch,
  ): Promise<MemberRecord | null> {
    const data: Prisma.MemberUpdateInput = {};
    if (patch.phone !== undefined) data.phone = patch.phone;
    if (patch.firstName !== undefined) data.firstName = patch.firstName;
    if (patch.lastName !== undefined) data.lastName = patch.lastName;
    if (patch.email !== undefined) data.email = patch.email;
    if (patch.status !== undefined) {
      data.status = patch.status;
      data.disabledAt = patch.status === 'disabled' ? new Date() : null;
    }

    const row = await this.prisma.member.update({
      where: { id: memberId },
      data,
      include: INCLUDE_WITH_SERVICES,
    });
    return toRecord(row);
  }

  async replaceStoreMembership(
    storeId: string,
    memberId: string,
    patch: ReplaceStoreMembershipPatch,
  ): Promise<void> {
    const data: Prisma.StoreMemberUpdateInput = {};
    if (patch.role !== undefined) data.role = patch.role;
    if (patch.permissions !== undefined) data.permissions = patch.permissions;
    if (Object.keys(data).length === 0) return;

    await this.prisma.storeMember.update({
      where: { storeId_memberId: { storeId, memberId } },
      data,
    });
  }

  async replaceServiceIds(
    memberId: string,
    serviceIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.memberService.deleteMany({ where: { memberId } });
      if (serviceIds.length > 0) {
        await tx.memberService.createMany({
          data: serviceIds.map((serviceId) => ({ memberId, serviceId })),
        });
      }
    });
  }

  async findExistingServiceIds(
    storeId: string,
    ids: string[],
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.service.findMany({
      where: { storeId, id: { in: ids } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  async findWorkIntervals(memberId: string): Promise<WorkIntervalRow[]> {
    const rows = await this.prisma.memberWorkInterval.findMany({
      where: { memberId },
      orderBy: [{ weekday: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map((row) => ({
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      sortOrder: row.sortOrder,
    }));
  }

  async findWorkIntervalsForMembers(
    filter?: ListWorkIntervalsFilter,
  ): Promise<WorkIntervalRowWithMember[]> {
    const where =
      filter?.memberIds && filter.memberIds.length > 0
        ? { memberId: { in: filter.memberIds } }
        : {};

    const rows = await this.prisma.memberWorkInterval.findMany({
      where,
      orderBy: [{ memberId: 'asc' }, { weekday: 'asc' }, { sortOrder: 'asc' }],
    });

    return rows.map((row) => ({
      memberId: row.memberId,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      sortOrder: row.sortOrder,
    }));
  }

  async replaceWorkIntervals(
    memberId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.memberWorkInterval.deleteMany({ where: { memberId } });
      if (intervals.length > 0) {
        await tx.memberWorkInterval.createMany({
          data: intervals.map((interval) => ({
            memberId,
            weekday: interval.weekday,
            startTime: interval.startTime,
            endTime: interval.endTime,
            sortOrder: interval.sortOrder,
          })),
        });
      }
    });
  }
}

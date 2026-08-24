import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  createPermissions,
  isTeamMemberRole,
  TeamMemberEntity,
  type TeamMemberPermissions,
  type TeamMemberRole,
} from '../../domain/entities/team-member.entity';
import {
  TeamMemberRepository,
  type TeamMemberCreatePayload,
  type TeamMemberCredentialsPayload,
  type TeamMemberKeycloakPayload,
  type TeamMemberWritePayload,
} from '../../domain/repositories/team-member.repository.interface';

type TeamMemberRow = Prisma.TeamMemberGetPayload<object>;

const ORDER_BY = [
  { role: Prisma.SortOrder.asc },
  { name: Prisma.SortOrder.asc },
] as const;

function toRole(value: string): TeamMemberRole {
  return isTeamMemberRole(value) ? value : 'broker';
}

/** Coluna JSON é livre — chave desconhecida some, ausente vira `false`. */
function toPermissions(raw: unknown): TeamMemberPermissions {
  if (!raw || typeof raw !== 'object') return createPermissions();
  const record = raw as Record<string, unknown>;
  const overrides = Object.fromEntries(
    Object.entries(record).filter(([, value]) => typeof value === 'boolean'),
  ) as Partial<TeamMemberPermissions>;
  return createPermissions(overrides);
}

@Injectable()
export class PrismaTeamMemberRepository extends TeamMemberRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(storeId: string): Promise<TeamMemberEntity[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: { storeId },
      orderBy: [...ORDER_BY],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<TeamMemberEntity | null> {
    const row = await this.prisma.teamMember.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findActiveByAgentIdGlobal(
    agentId: string,
  ): Promise<TeamMemberEntity[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: { agentId, active: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByEmail(
    storeId: string,
    email: string,
  ): Promise<TeamMemberEntity | null> {
    const row = await this.prisma.teamMember.findFirst({
      where: { storeId, email: { equals: email, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findActiveAdmin(storeId: string): Promise<TeamMemberEntity | null> {
    const row = await this.prisma.teamMember.findFirst({
      where: { storeId, role: 'admin', active: true },
      orderBy: { createdAt: 'asc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByKeycloakSub(keycloakSub: string): Promise<TeamMemberEntity[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: { keycloakSub, active: true },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByStoreAndKeycloakSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<TeamMemberEntity | null> {
    const row = await this.prisma.teamMember.findFirst({
      where: { storeId, keycloakSub },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByEmailInsensitive(email: string): Promise<TeamMemberEntity[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: { email: { equals: email, mode: 'insensitive' }, active: true },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async linkKeycloakSub(
    memberId: string,
    payload: TeamMemberKeycloakPayload,
  ): Promise<TeamMemberEntity | null> {
    try {
      const row = await this.prisma.teamMember.update({
        where: { id: memberId },
        data: {
          keycloakSub: payload.keycloakSub,
          username: payload.username,
          hasPassword: payload.hasPassword ?? false,
        },
      });
      return this.toEntity(row);
    } catch {
      return null;
    }
  }

  async markPasswordSet(memberId: string): Promise<void> {
    await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { hasPassword: true, mustChangePassword: false },
    });
  }

  async create(
    storeId: string,
    payload: TeamMemberCreatePayload,
  ): Promise<TeamMemberEntity> {
    const row = await this.prisma.teamMember.create({
      data: {
        id: randomUUID(),
        storeId,
        agentId: payload.agentId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        initials: payload.initials,
        active: payload.active,
        permissionsJson: { ...payload.permissions },
        lastAccessAt: payload.lastAccessAt,
        passwordHash: payload.passwordHash,
        temporaryPassword: payload.temporaryPassword,
        mustChangePassword: payload.mustChangePassword,
        keycloakSub: payload.keycloakSub ?? null,
        username: payload.username ?? null,
        hasPassword: payload.hasPassword ?? false,
      },
    });
    return this.toEntity(row);
  }

  async update(
    storeId: string,
    agentId: string,
    payload: TeamMemberWritePayload,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.prisma.teamMember.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.teamMember.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        initials: payload.initials,
        active: payload.active,
        permissionsJson: { ...payload.permissions },
      },
    });
    return this.toEntity(row);
  }

  async updateCredentials(
    storeId: string,
    agentId: string,
    payload: TeamMemberCredentialsPayload,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.prisma.teamMember.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.teamMember.update({
      where: { id: existing.id },
      data: {
        passwordHash: payload.passwordHash,
        temporaryPassword: payload.temporaryPassword,
        mustChangePassword: payload.mustChangePassword,
      },
    });
    return this.toEntity(row);
  }

  async setActive(
    storeId: string,
    agentId: string,
    active: boolean,
  ): Promise<TeamMemberEntity | null> {
    const existing = await this.prisma.teamMember.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.teamMember.update({
      where: { id: existing.id },
      data: { active },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, agentId: string): Promise<boolean> {
    const { count } = await this.prisma.teamMember.deleteMany({
      where: { storeId, agentId },
    });
    return count > 0;
  }

  private toEntity(row: TeamMemberRow): TeamMemberEntity {
    return TeamMemberEntity.create(
      {
        storeId: row.storeId,
        agentId: row.agentId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: toRole(row.role),
        initials: row.initials,
        active: row.active,
        permissions: toPermissions(row.permissionsJson),
        lastAccessAt: row.lastAccessAt,
        passwordHash: row.passwordHash,
        temporaryPassword: row.temporaryPassword,
        mustChangePassword: row.mustChangePassword,
        keycloakSub: row.keycloakSub,
        username: row.username,
        hasPassword: row.hasPassword,
      },
      row.id,
    );
  }
}

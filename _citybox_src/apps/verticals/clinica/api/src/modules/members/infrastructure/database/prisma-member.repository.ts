import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  MemberRepository,
  type CreateMemberData,
  type MemberPersistenceRecord,
  type MemberRecord,
  type RestoreMemberData,
  type UpdateMemberData,
} from '../../domain/repositories/member.repository';
import type { OrganizationMemberRole } from '../../domain/organization-member-role';
import {
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilSnapshot,
  type ProfessionalCouncilType,
} from '../../domain/professional-council';

type RowWithClinics = {
  id: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  status: string;
  organizationRole: string;
  hasPassword: boolean;
  provisionalExpiresAt: Date | null;
  disabledAt: Date | null;
  deletedAt: Date | null;
  councilType: ProfessionalCouncilType | null;
  councilNumber: string | null;
  councilUf: string | null;
  clinics: Array<{
    clinicId: string;
    role: string;
    permissions: unknown;
    clinic: { name: string };
  }>;
};

function toRecord(row: RowWithClinics): MemberRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    keycloakSub: row.keycloakSub,
    username: row.username,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    status: row.status as MemberRecord['status'],
    organizationRole: row.organizationRole as OrganizationMemberRole,
    hasPassword: row.hasPassword,
    provisionalExpiresAt: row.provisionalExpiresAt,
    disabledAt: row.disabledAt,
    councilType: row.councilType,
    councilNumber: row.councilNumber,
    councilUf: row.councilUf,
    memberships: row.clinics.map((c) => ({
      clinicId: c.clinicId,
      clinicName: c.clinic.name,
      role: c.role,
      permissions: Array.isArray(c.permissions)
        ? (c.permissions as string[])
        : [],
    })),
  };
}

function toPersistenceRecord(row: RowWithClinics): MemberPersistenceRecord {
  return {
    ...toRecord(row),
    deletedAt: row.deletedAt,
  };
}

const INCLUDE = {
  clinics: { include: { clinic: { select: { name: true } } } },
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
    return row ? toRecord(row as RowWithClinics) : null;
  }

  async findByUsername(username: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { username, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row as RowWithClinics) : null;
  }

  async findOwnerByOrganization(
    organizationId: string,
  ): Promise<MemberRecord | null> {
    // `deletedAt: null` para casar com o índice único parcial: um responsável já
    // removido não pode bloquear a entrada de um novo.
    const row = await this.prisma.member.findFirst({
      where: { organizationId, organizationRole: 'OWNER', deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row as RowWithClinics) : null;
  }

  async findByEmail(email: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { email, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row as RowWithClinics) : null;
  }

  async findByKeycloakSub(sub: string): Promise<MemberRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { keycloakSub: sub, deletedAt: null },
      include: INCLUDE,
    });
    return row ? toRecord(row as RowWithClinics) : null;
  }

  async findAnyByKeycloakSub(
    sub: string,
  ): Promise<MemberPersistenceRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { keycloakSub: sub },
      include: INCLUDE,
    });
    return row ? toPersistenceRecord(row as RowWithClinics) : null;
  }

  async findAnyByUsername(
    username: string,
  ): Promise<MemberPersistenceRecord | null> {
    const row = await this.prisma.member.findFirst({
      where: { username },
      include: INCLUDE,
    });
    return row ? toPersistenceRecord(row as RowWithClinics) : null;
  }

  async listByOrganization(organizationId: string): Promise<MemberRecord[]> {
    const rows = await this.prisma.member.findMany({
      where: { organizationId, deletedAt: null },
      include: INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => toRecord(r as RowWithClinics));
  }

  async countActiveByOrganization(organizationId: string): Promise<number> {
    return this.prisma.member.count({
      where: { organizationId, status: 'active', deletedAt: null },
    });
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
        hasPassword: data.hasPassword,
        ...(data.organizationRole
          ? { organizationRole: data.organizationRole }
          : {}),
        clinics: {
          create: data.clinics.map((c) => ({
            clinicId: c.clinicId,
            role: c.role,
            permissions: c.permissions,
          })),
        },
      },
      include: INCLUDE,
    });
    return toRecord(row as RowWithClinics);
  }

  async restore(id: string, data: RestoreMemberData): Promise<MemberRecord> {
    const row = await this.prisma.member.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'active',
        disabledAt: null,
        keycloakSub: data.keycloakSub,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        hasPassword: false,
        clinics: {
          deleteMany: {},
          create: data.clinics.map((c) => ({
            clinicId: c.clinicId,
            role: c.role,
            permissions: c.permissions,
          })),
        },
      },
      include: INCLUDE,
    });
    return toRecord(row as RowWithClinics);
  }

  async update(id: string, data: UpdateMemberData): Promise<MemberRecord> {
    const row = await this.prisma.member.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        // Reescreve o escopo por clínica inteiro quando informado: é a semântica que a
        // tela usa (o operador manda o conjunto final, não um delta).
        ...(data.clinics
          ? {
              clinics: {
                deleteMany: {},
                create: data.clinics.map((c) => ({
                  clinicId: c.clinicId,
                  role: c.role,
                  permissions: c.permissions,
                })),
              },
            }
          : {}),
      },
      include: INCLUDE,
    });
    return toRecord(row as RowWithClinics);
  }

  async setProfessionalCouncilIfEmpty(
    id: string,
    council: ProfessionalCouncilSnapshot,
  ): Promise<MemberRecord> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`member ${id} não encontrado`);
    }
    if (
      toProfessionalCouncilSnapshot({
        councilType: current.councilType,
        councilNumber: current.councilNumber,
        councilUf: current.councilUf,
      })
    ) {
      return current;
    }

    const row = await this.prisma.member.update({
      where: { id },
      data: {
        councilType: council.councilType,
        councilNumber: council.councilNumber,
        councilUf: council.councilUf,
      },
      include: INCLUDE,
    });
    return toRecord(row as RowWithClinics);
  }

  async softDelete(id: string): Promise<void> {
    // Soft delete: o id é referenciado por agendamentos, orçamentos e comissões sem FK.
    // Apagar de verdade deixaria o histórico clínico órfão em silêncio.
    await this.prisma.member.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'disabled', disabledAt: new Date() },
    });
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

  async setStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
    await this.prisma.member.update({
      where: { id },
      data: {
        status,
        disabledAt: status === 'disabled' ? new Date() : null,
      },
    });
  }
}

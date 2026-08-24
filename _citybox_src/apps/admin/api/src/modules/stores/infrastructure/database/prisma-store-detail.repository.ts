import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { txClient } from '../../../../shared/infra/prisma/transaction.context';
import {
  getIntegrationCatalogForVertical,
  getModuleCatalogForVertical,
  getModuleCatalogItem,
} from '../../domain/catalog/store-vertical.catalog';
import type { StoreVertical } from '../../domain/entities/store.entity';
import {
  StoreDetailRepository,
  type RecordStoreAuditEventInput,
  type StoreAuditEventRow,
  type StoreAuditLogCriteria,
  type StoreDetailRelatedRows,
  type StoreMemberRow,
  type UpsertStoreMemberInput,
  type GlobalMemberLookupResult,
} from '../../domain/repositories/store-detail.repository.interface';

@Injectable()
export class PrismaStoreDetailRepository extends StoreDetailRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async ensureCatalog(storeId: string, vertical: StoreVertical): Promise<void> {
    const moduleCatalog = getModuleCatalogForVertical(vertical);
    const integrationCatalog = getIntegrationCatalogForVertical(vertical);

    // Sequencial em `prisma.db` de propósito: quando este método roda dentro de
    // `UnitOfWork.run()`, `db` já é o cliente transacional e um `$transaction([...])`
    // aqui seria transação aninhada (Prisma não suporta). Fora de UoW, cada upsert é
    // idempotente por chave composta, então perder atomicidade entre eles é inofensivo —
    // a próxima chamada de `ensureCatalog` completa o que faltou.
    const db = txClient(this.prisma);

    for (const item of moduleCatalog) {
      await db.storeModule.upsert({
        where: {
          storeId_moduleKey: { storeId, moduleKey: item.moduleKey },
        },
        create: {
          storeId,
          moduleKey: item.moduleKey,
          enabled: false,
        },
        update: {},
      });
    }

    for (const item of integrationCatalog) {
      await db.storeIntegration.upsert({
        where: {
          storeId_integrationKey: {
            storeId,
            integrationKey: item.integrationKey,
          },
        },
        create: {
          storeId,
          integrationKey: item.integrationKey,
          label: item.label,
          status: 'disconnected',
        },
        update: {},
      });
    }
  }

  async findRelatedByStoreId(
    storeId: string,
    vertical: StoreVertical,
  ): Promise<StoreDetailRelatedRows> {
    await this.ensureCatalog(storeId, vertical);

    const [terminals, errors, members, modules, integrations] =
      await Promise.all([
        this.prisma.storeTerminal.findMany({
          where: { storeId },
          orderBy: { label: 'asc' },
        }),
        this.prisma.storeError.findMany({
          where: { storeId },
          orderBy: { occurredAt: 'desc' },
          take: 10,
        }),
        this.prisma.storeMember.findMany({
          where: { storeId },
          orderBy: { member: { firstName: 'asc' } },
          include: { member: true },
        }),
        this.prisma.storeModule.findMany({
          where: { storeId },
          orderBy: { moduleKey: 'asc' },
        }),
        this.prisma.storeIntegration.findMany({
          where: { storeId },
          orderBy: { label: 'asc' },
        }),
      ]);

    return {
      terminals: terminals.map((row) => ({
        id: row.id,
        label: row.label,
        status: row.status as 'online' | 'offline',
      })),
      errors: errors.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        message: row.message,
        severity: row.severity as 'warning' | 'error',
      })),
      members: members.map((row) => this.toMemberRow(row as any)),
      modules: modules.map((row) => {
        const catalog = getModuleCatalogItem(vertical, row.moduleKey);
        return {
          id: row.id,
          moduleKey: row.moduleKey,
          label: catalog?.label ?? row.moduleKey,
          enabled: row.enabled,
          description: catalog?.description ?? 'Módulo da plataforma Citybox.',
        };
      }),
      integrations: integrations.map((row) => ({
        id: row.id,
        integrationKey: row.integrationKey,
        label: row.label,
        status: row.status as 'connected' | 'disconnected' | 'error',
      })),
    };
  }

  async updateModuleEnabled(
    storeId: string,
    moduleKey: string,
    enabled: boolean,
  ): Promise<void> {
    await txClient(this.prisma).storeModule.update({
      where: {
        storeId_moduleKey: { storeId, moduleKey },
      },
      data: { enabled },
    });
  }

  async listMembers(storeId: string): Promise<StoreMemberRow[]> {
    const rows = await this.prisma.storeMember.findMany({
      where: { storeId },
      orderBy: { member: { firstName: 'asc' } },
      include: { member: true },
    });
    return rows.map((row) => this.toMemberRow(row as any));
  }

  async findMemberById(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow | null> {
    const row = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
      include: { member: true },
    });
    return row ? this.toMemberRow(row) : null;
  }

  async findMemberByStoreAndSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<StoreMemberRow | null> {
    const row = await this.prisma.storeMember.findFirst({
      where: { storeId, member: { keycloakSub } },
      include: { member: true },
    });
    return row ? this.toMemberRow(row) : null;
  }

  async findMemberByEmailOrUsername(
    email?: string,
    username?: string,
  ): Promise<GlobalMemberLookupResult | null> {
    const conditions: any[] = [];
    if (email) conditions.push({ email: email.trim().toLowerCase() });
    if (username) conditions.push({ username: username.trim().toLowerCase() });

    if (conditions.length === 0) return null;

    const member = await this.prisma.member.findFirst({
      where: { OR: conditions },
    });

    if (!member) return null;

    return {
      id: member.id,
      keycloakSub: member.keycloakSub,
      username: member.username,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      hasPassword: member.hasPassword,
    };
  }

  async findGlobalMemberById(
    memberId: string,
  ): Promise<GlobalMemberLookupResult | null> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) return null;

    return {
      id: member.id,
      keycloakSub: member.keycloakSub,
      username: member.username,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      hasPassword: member.hasPassword,
    };
  }

  async createMember(input: UpsertStoreMemberInput): Promise<StoreMemberRow> {
    let member = await this.prisma.member.findUnique({
      where: { keycloakSub: input.keycloakSub },
    });

    if (!member) {
      member = await txClient(this.prisma).member.create({
        data: {
          keycloakSub: input.keycloakSub,
          username: input.username.trim().toLowerCase(),
          email:
            input.email?.trim().toLowerCase() ||
            `${input.username.trim().toLowerCase()}@placeholder.citybox.com`,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          hasPassword: input.hasPassword ?? false,
          provisionalExpiresAt: input.provisionalExpiresAt ?? null,
        },
      });
    }

    const row = await txClient(this.prisma).storeMember.create({
      data: {
        storeId: input.storeId,
        memberId: member.id,
        role: input.role.trim(),
        permissions: input.permissions,
      },
      include: { member: true },
    });
    return this.toMemberRow(row);
  }

  async updateMember(
    storeId: string,
    memberId: string,
    input: Omit<
      UpsertStoreMemberInput,
      'storeId' | 'keycloakSub' | 'username' | 'email'
    >,
  ): Promise<StoreMemberRow> {
    const existing = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
      include: { member: true },
    });
    if (!existing) {
      throw new Error('Store member not found');
    }

    await txClient(this.prisma).member.update({
      where: { id: existing.memberId },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      },
    });

    const row = await txClient(this.prisma).storeMember.update({
      where: { id: memberId },
      data: {
        role: input.role.trim(),
        permissions: input.permissions,
      },
      include: { member: true },
    });
    return this.toMemberRow(row);
  }

  async markMemberHasPassword(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow> {
    const existing = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });
    if (!existing) {
      throw new Error('Store member not found');
    }

    await txClient(this.prisma).member.update({
      where: { id: existing.memberId },
      data: { hasPassword: true, provisionalExpiresAt: null },
    });

    const row = await this.prisma.storeMember.findUnique({
      where: { id: memberId },
      include: { member: true },
    });
    return this.toMemberRow(row!);
  }

  async setMemberDisabled(
    storeId: string,
    memberId: string,
    disabledAt: Date | null,
  ): Promise<StoreMemberRow> {
    const existing = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });
    if (!existing) {
      throw new Error('Store member not found');
    }

    await txClient(this.prisma).member.update({
      where: { id: existing.memberId },
      data: { disabledAt },
    });

    const row = await this.prisma.storeMember.findUnique({
      where: { id: memberId },
      include: { member: true },
    });
    return this.toMemberRow(row!);
  }

  async setMemberProvisionalExpiresAt(
    storeId: string,
    memberId: string,
    provisionalExpiresAt: Date | null,
  ): Promise<StoreMemberRow> {
    const existing = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });
    if (!existing) {
      throw new Error('Store member not found');
    }

    await txClient(this.prisma).member.update({
      where: { id: existing.memberId },
      data: { provisionalExpiresAt },
    });

    const row = await this.prisma.storeMember.findUnique({
      where: { id: memberId },
      include: { member: true },
    });
    return this.toMemberRow(row!);
  }

  async deleteMember(storeId: string, memberId: string): Promise<void> {
    const existing = await this.prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
    });
    if (!existing) {
      throw new Error('Store member not found');
    }

    await txClient(this.prisma).storeMember.delete({
      where: { id: memberId },
    });
  }

  async recordAuditEvent(input: RecordStoreAuditEventInput): Promise<void> {
    await txClient(this.prisma).storeAuditEvent.create({
      data: {
        storeId: input.storeId,
        occurredAt: new Date(),
        severity: input.severity ?? 'info',
        actor: input.actor,
        actorRole: input.actorRole ?? null,
        module: input.module,
        action: input.action,
        details: input.details ?? null,
      },
    });
  }

  async listAuditEvents(criteria: StoreAuditLogCriteria): Promise<{
    items: StoreAuditEventRow[];
    total: number;
  }> {
    const where = this.buildAuditWhere(criteria);
    const [rows, total] = await Promise.all([
      this.prisma.storeAuditEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
      this.prisma.storeAuditEvent.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        severity: row.severity as StoreAuditEventRow['severity'],
        actor: row.actor,
        actorRole: row.actorRole,
        module: row.module,
        action: row.action,
        details: row.details,
      })),
      total,
    };
  }

  private buildAuditWhere(
    criteria: StoreAuditLogCriteria,
  ): Prisma.StoreAuditEventWhereInput {
    const conditions: Prisma.StoreAuditEventWhereInput[] = [
      { storeId: criteria.storeId },
    ];

    if (criteria.severity?.length) {
      conditions.push({ severity: { in: criteria.severity } });
    }

    if (criteria.dateFrom || criteria.dateTo) {
      conditions.push({
        occurredAt: {
          ...(criteria.dateFrom ? { gte: criteria.dateFrom } : {}),
          ...(criteria.dateTo ? { lte: criteria.dateTo } : {}),
        },
      });
    }

    const search = criteria.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { actor: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: conditions };
  }

  private toMemberRow(row: {
    id: string;
    role: string;
    permissions: unknown;
    member: {
      keycloakSub: string;
      username: string;
      email: string | null;
      firstName: string;
      lastName: string;
      hasPassword: boolean;
      disabledAt: Date | null;
      provisionalExpiresAt: Date | null;
    };
  }): StoreMemberRow {
    const permissions = Array.isArray(row.permissions)
      ? row.permissions.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];

    return {
      id: row.id,
      keycloakSub: row.member.keycloakSub,
      username: row.member.username,
      email: row.member.email,
      firstName: row.member.firstName,
      lastName: row.member.lastName,
      role: row.role,
      permissions,
      hasPassword: row.member.hasPassword,
      disabledAt: row.member.disabledAt,
      provisionalExpiresAt: row.member.provisionalExpiresAt,
    };
  }
}

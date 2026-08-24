import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  DealEntity,
  type DealStage,
  type DealStatus,
  type DealType,
} from '../../domain/entities/deal.entity';
import {
  DealRepository,
  type CreateDealPayload,
  type ListDealsFilters,
  type ListDealsResult,
  type UpdateDealPayload,
  type UpdateDealStagePayload,
} from '../../domain/repositories/deal.repository.interface';

type DealRow = Prisma.DealGetPayload<Record<string, never>>;

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

@Injectable()
export class PrismaDealRepository extends DealRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListDealsFilters,
  ): Promise<ListDealsResult> {
    const where = this.buildWhere(storeId, filters);
    const skip = (filters.page - 1) * filters.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.perPage,
      }),
      this.prisma.deal.count({ where }),
    ]);
    return { items: rows.map((row) => this.toEntity(row)), total };
  }

  async findById(storeId: string, id: string): Promise<DealEntity | null> {
    const row = await this.prisma.deal.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findActiveByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null> {
    const row = await this.prisma.deal.findFirst({
      where: { storeId, leadId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findPipelineDealByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null> {
    const active = await this.findActiveByLeadId(storeId, leadId);
    if (active) return active;

    const row = await this.prisma.deal.findFirst({
      where: { storeId, leadId, status: 'won' },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(payload: CreateDealPayload): Promise<DealEntity> {
    const row = await this.prisma.deal.create({
      data: {
        id: randomUUID(),
        storeId: payload.storeId,
        leadId: payload.leadId,
        propertyId: payload.propertyId ?? null,
        propertyName: payload.propertyName ?? '',
        leadName: payload.leadName ?? null,
        type: payload.type ?? null,
        status: payload.status ?? 'active',
        stage: payload.stage ?? 'awaiting_property',
        title: payload.title ?? '',
        agentId: payload.agentId ?? null,
      },
    });
    return this.toEntity(row);
  }

  async update(
    storeId: string,
    id: string,
    payload: UpdateDealPayload,
  ): Promise<DealEntity | null> {
    try {
      const row = await this.prisma.deal.update({
        where: { id, storeId },
        data: {
          ...(payload.propertyId !== undefined
            ? { propertyId: payload.propertyId }
            : {}),
          ...(payload.propertyName !== undefined
            ? { propertyName: payload.propertyName }
            : {}),
          ...(payload.leadName !== undefined
            ? { leadName: payload.leadName }
            : {}),
          ...(payload.type !== undefined ? { type: payload.type } : {}),
          ...(payload.status !== undefined ? { status: payload.status } : {}),
          ...(payload.stage !== undefined ? { stage: payload.stage } : {}),
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.agentId !== undefined
            ? { agentId: payload.agentId }
            : {}),
        },
      });
      return this.toEntity(row);
    } catch {
      return null;
    }
  }

  async updateStage(
    storeId: string,
    id: string,
    payload: UpdateDealStagePayload,
  ): Promise<DealEntity | null> {
    try {
      const row = await this.prisma.deal.update({
        where: { id, storeId },
        data: {
          stage: payload.stage,
          ...(payload.status !== undefined ? { status: payload.status } : {}),
        },
      });
      return this.toEntity(row);
    } catch {
      return null;
    }
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const result = await this.prisma.deal.deleteMany({
      where: { id, storeId },
    });
    return result.count > 0;
  }

  private buildWhere(
    storeId: string,
    filters: ListDealsFilters,
  ): Prisma.DealWhereInput {
    const where: Prisma.DealWhereInput = { storeId };

    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.stage?.length) where.stage = { in: filters.stage };

    if (filters.search?.trim()) {
      const term = normalizeSearch(filters.search);
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { propertyName: { contains: term, mode: 'insensitive' } },
        { leadName: { contains: term, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toEntity(row: DealRow): DealEntity {
    return DealEntity.create(
      {
        storeId: row.storeId,
        leadId: row.leadId,
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        leadName: row.leadName,
        type: row.type,
        status: row.status,
        stage: row.stage,
        title: row.title,
        agentId: row.agentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}

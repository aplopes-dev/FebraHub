import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { Prisma } from '../../../../../../generated/prisma/client';

export interface ListGlobalAuditDto {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface GlobalAuditItem {
  id: string;
  storeId: string | null;
  storeName: string;
  occurredAt: string;
  severity: string;
  actor: string;
  actorRole: string | null;
  module: string;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface ListGlobalAuditResult {
  data: GlobalAuditItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

@Injectable()
export class ListGlobalAuditUseCase implements IUseCase<
  ListGlobalAuditDto,
  ListGlobalAuditResult
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({
    page = 1,
    perPage = 20,
    search,
  }: ListGlobalAuditDto): Promise<ListGlobalAuditResult> {
    const skip = (page - 1) * perPage;

    const where: Prisma.StoreAuditEventWhereInput = {};
    if (search?.trim()) {
      const searchLower = search.trim();
      where.OR = [
        { actor: { contains: searchLower, mode: 'insensitive' } },
        { module: { contains: searchLower, mode: 'insensitive' } },
        { action: { contains: searchLower, mode: 'insensitive' } },
        { details: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.storeAuditEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: perPage,
        include: {
          store: {
            select: {
              tradeName: true,
            },
          },
        },
      }),
      this.prisma.storeAuditEvent.count({ where }),
    ]);

    const data = events.map((event) => ({
      id: event.id,
      storeId: event.storeId,
      storeName: event.store?.tradeName ?? 'Loja Removida',
      occurredAt: event.occurredAt.toISOString(),
      severity: event.severity,
      actor: event.actor,
      actorRole: event.actorRole,
      module: event.module,
      action: event.action,
      details: event.details,
      createdAt: event.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}

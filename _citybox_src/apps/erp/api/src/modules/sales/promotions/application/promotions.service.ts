import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  resolvePagination,
  type Pagination,
} from '../../../tenancy/application/pagination';
import type { PromotionWritableHttpDto } from '../http/dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    params: {
      search?: string;
      type?: string;
      tab?: 'active' | 'deleted';
      page?: number;
      perPage?: number;
    },
  ) {
    const tab = params.tab ?? 'active';
    const where = this.buildWhere(organizationId, { ...params, tab });
    const total = await this.prisma.scoped.promotion.count({ where });
    const pagination: Pagination = resolvePagination(
      total,
      params.page,
      params.perPage,
    );

    const [rows, activeCount, deletedCount] = await Promise.all([
      this.prisma.scoped.promotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.perPage,
      }),
      this.prisma.scoped.promotion.count({
        where: this.buildWhere(organizationId, {
          search: params.search,
          type: params.type,
          tab: 'active',
        }),
      }),
      this.prisma.scoped.promotion.count({
        where: this.buildWhere(organizationId, {
          search: params.search,
          type: params.type,
          tab: 'deleted',
        }),
      }),
    ]);

    return {
      data: rows.map((row) => this.toHttp(row)),
      meta: {
        total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      },
      tabCounts: { active: activeCount, deleted: deletedCount },
    };
  }

  async findById(organizationId: string, id: string) {
    const row = await this.prisma.scoped.promotion.findFirst({
      where: { id, organizationId },
    });
    if (!row) throw new NotFoundException('Promoção não encontrada');
    return this.toHttp(row);
  }

  async create(organizationId: string, dto: PromotionWritableHttpDto) {
    const row = await this.prisma.scoped.promotion.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        type: dto.type,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        rulesJson: (dto.rulesJson ?? {}) as Prisma.InputJsonValue,
        branchIds: dto.branchIds ?? [],
      },
    });
    return this.toHttp(row);
  }

  async update(
    organizationId: string,
    id: string,
    dto: PromotionWritableHttpDto,
  ) {
    await this.assertExists(organizationId, id);
    const row = await this.prisma.scoped.promotion.update({
      where: { id, organizationId },
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        type: dto.type,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        rulesJson: (dto.rulesJson ?? {}) as Prisma.InputJsonValue,
        branchIds: dto.branchIds ?? [],
      },
    });
    return this.toHttp(row);
  }

  async softDelete(organizationId: string, id: string): Promise<void> {
    await this.assertExists(organizationId, id);
    await this.prisma.scoped.promotion.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(organizationId: string, id: string) {
    await this.assertExists(organizationId, id, true);
    const row = await this.prisma.scoped.promotion.update({
      where: { id, organizationId },
      data: { deletedAt: null },
    });
    return this.toHttp(row);
  }

  /**
   * Stub — motor de regras por `type`/`rulesJson` fica para fase futura.
   * Devolve 0 para não travar o checkout enquanto o motor não existe.
   */
  preview(
    productIds: string[],
    quantities: number[],
  ): { discountCents: number } {
    void productIds;
    void quantities;
    return { discountCents: 0 };
  }

  private async assertExists(
    organizationId: string,
    id: string,
    allowDeleted = false,
  ) {
    const found = await this.prisma.scoped.promotion.findFirst({
      where: { id, organizationId },
      select: { id: true, deletedAt: true },
    });
    if (!found || (!allowDeleted && found.deletedAt)) {
      throw new NotFoundException('Promoção não encontrada');
    }
  }

  private buildWhere(
    organizationId: string,
    params: {
      search?: string;
      type?: string;
      tab?: 'active' | 'deleted';
    },
  ) {
    const tab = params.tab ?? 'active';
    const and: Record<string, unknown>[] = [
      tab === 'deleted' ? { deletedAt: { not: null } } : { deletedAt: null },
    ];
    if (params.type) and.push({ type: params.type });
    if (params.search?.trim()) {
      and.push({
        name: { contains: params.search.trim(), mode: 'insensitive' },
      });
    }
    return { organizationId, AND: and };
  }

  private toHttp(row: {
    id: string;
    name: string;
    description: string;
    type: string;
    startsAt: Date;
    endsAt: Date;
    rulesJson: unknown;
    branchIds: string[];
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      rulesJson: row.rulesJson,
      branchIds: row.branchIds,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

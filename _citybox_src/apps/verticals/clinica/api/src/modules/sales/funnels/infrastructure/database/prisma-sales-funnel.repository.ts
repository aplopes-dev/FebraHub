import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

import type { SalesFunnel } from '../../domain/entities/sales-funnel.entity';
import {
  SalesFunnelRepository,
  type SalesFunnelListCriteria,
} from '../../domain/repositories/sales-funnel.repository';
import { SalesFunnelEntityMapper } from './sales-funnel.entity-mapper';

@Injectable()
export class PrismaSalesFunnelRepository extends SalesFunnelRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<SalesFunnel | null> {
    const row = await this.prisma.salesFunnel.findFirst({
      where: { storeId, id },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    return row ? SalesFunnelEntityMapper.toDomain(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: SalesFunnelListCriteria,
  ): Promise<SalesFunnel[]> {
    const rows = await this.prisma.salesFunnel.findMany({
      where: { storeId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => SalesFunnelEntityMapper.toDomain(row));
  }

  async count(storeId: string): Promise<number> {
    return this.prisma.salesFunnel.count({ where: { storeId } });
  }

  async countDefaults(storeId: string): Promise<number> {
    return this.prisma.salesFunnel.count({
      where: { storeId, isDefault: true },
    });
  }

  async listDefaults(
    storeId: string,
  ): Promise<Array<{ id: string; name: string; isDefault: boolean }>> {
    const rows = await this.prisma.salesFunnel.findMany({
      where: { storeId, isDefault: true },
      select: { id: true, name: true, isDefault: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  }

  async create(funnel: SalesFunnel): Promise<SalesFunnel> {
    const row = await this.prisma.salesFunnel.create({
      data: {
        id: funnel.id,
        storeId: funnel.storeId,
        name: funnel.name,
        isDefault: funnel.isDefault,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        stages: {
          create: funnel.stages.map((stage) => ({
            id: stage.id,
            storeId: stage.storeId,
            name: stage.name,
            type: stage.type,
            color: stage.color,
            order: stage.order,
            createdAt: stage.createdAt,
            updatedAt: stage.updatedAt,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    return SalesFunnelEntityMapper.toDomain(row);
  }

  async createMany(funnels: SalesFunnel[]): Promise<SalesFunnel[]> {
    const created: SalesFunnel[] = [];
    await this.prisma.$transaction(async (tx) => {
      for (const funnel of funnels) {
        const row = await tx.salesFunnel.create({
          data: {
            id: funnel.id,
            storeId: funnel.storeId,
            name: funnel.name,
            isDefault: funnel.isDefault,
            createdAt: funnel.createdAt,
            updatedAt: funnel.updatedAt,
            stages: {
              create: funnel.stages.map((stage) => ({
                id: stage.id,
                storeId: stage.storeId,
                name: stage.name,
                type: stage.type,
                color: stage.color,
                order: stage.order,
                createdAt: stage.createdAt,
                updatedAt: stage.updatedAt,
              })),
            },
          },
          include: { stages: { orderBy: { order: 'asc' } } },
        });
        created.push(SalesFunnelEntityMapper.toDomain(row));
      }
    });
    return created;
  }

  async save(
    funnel: SalesFunnel,
    options?: { stageIdsToDelete?: string[] },
  ): Promise<SalesFunnel> {
    const stageIdsToDelete = options?.stageIdsToDelete ?? [];

    const row = await this.prisma.$transaction(async (tx) => {
      if (stageIdsToDelete.length > 0) {
        await tx.salesFunnelStage.deleteMany({
          where: {
            funnelId: funnel.id,
            storeId: funnel.storeId,
            id: { in: stageIdsToDelete },
          },
        });
      }

      // Fase 1: orders temporários negativos evitam colisão com o UNIQUE
      // (funnel_id, order) ao trocar posições (ex.: 0↔1).
      for (let index = 0; index < funnel.stages.length; index += 1) {
        const stage = funnel.stages[index];
        await tx.salesFunnelStage.updateMany({
          where: {
            id: stage.id,
            funnelId: funnel.id,
            storeId: funnel.storeId,
          },
          data: { order: -(index + 1), updatedAt: stage.updatedAt },
        });
      }

      // Fase 2: upsert com a ordem final.
      for (const stage of funnel.stages) {
        await tx.salesFunnelStage.upsert({
          where: { id: stage.id },
          create: {
            id: stage.id,
            storeId: stage.storeId,
            funnelId: funnel.id,
            name: stage.name,
            type: stage.type,
            color: stage.color,
            order: stage.order,
            createdAt: stage.createdAt,
            updatedAt: stage.updatedAt,
          },
          update: {
            name: stage.name,
            type: stage.type,
            color: stage.color,
            order: stage.order,
            updatedAt: stage.updatedAt,
          },
        });
      }

      return tx.salesFunnel.update({
        where: { id: funnel.id },
        data: {
          name: funnel.name,
          updatedAt: funnel.updatedAt,
        },
        include: { stages: { orderBy: { order: 'asc' } } },
      });
    });

    return SalesFunnelEntityMapper.toDomain(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.salesFunnel.deleteMany({ where: { storeId, id } });
  }

  async countOpportunitiesByStage(
    storeId: string,
    stageId: string,
  ): Promise<number> {
    return this.prisma.salesOpportunity.count({
      where: { storeId, stageId },
    });
  }
}

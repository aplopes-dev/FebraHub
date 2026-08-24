import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PlanRepository,
  type PlanListCriteria,
} from '../../domain/repositories/plan.repository.interface';
import {
  Plan,
  type PlanProps,
  type PlanStatus,
} from '../../domain/entities/plan.entity';
import { SubscriptionCycle } from '../../../subscriptions/domain/entities/subscription.entity';

@Injectable()
export class PrismaPlanRepository extends PlanRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Plan | null> {
    const row = await this.prisma.plan.findUnique({
      where: { id },
      include: { prices: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Plan | null> {
    const row = await this.prisma.plan.findUnique({
      where: { code },
      include: { prices: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria?: PlanListCriteria): Promise<Plan[]> {
    const rows = await this.prisma.plan.findMany({
      where: this.buildWhere(criteria),
      skip: criteria?.skip,
      take: criteria?.take,
      orderBy: { createdAt: 'desc' },
      include: { prices: true },
    });

    return rows.map((row) => this.toEntity(row));
  }

  async count(criteria?: PlanListCriteria): Promise<number> {
    return this.prisma.plan.count({ where: this.buildWhere(criteria) });
  }

  async countSubscribersByCode(code: string): Promise<number> {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!plan) return 0;
    return this.prisma.subscription.count({
      where: { planPrice: { planId: plan.id } },
    });
  }

  async save(plan: Plan): Promise<Plan> {
    const saved = await this.prisma.$transaction(async (tx) => {
      await tx.plan.upsert({
        where: { id: plan.id },
        create: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          vertical: plan.vertical,
          tier: plan.tier,
          maxStores: plan.maxStores,
          maxNegocios: plan.maxNegocios,
          maxUsers: plan.maxUsers,
          maxProducts: plan.maxProducts,
          status: plan.status,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          prices: {
            create: plan.prices.map((p) => ({
              id: p.id,
              stripePriceId: p.stripePriceId,
              cycle: p.cycle,
              priceCents: p.priceCents,
              status: p.status ?? 'ACTIVE',
              createdAt: p.createdAt,
              updatedAt: p.updatedAt ?? new Date(),
            })),
          },
        },
        update: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          vertical: plan.vertical,
          tier: plan.tier,
          maxStores: plan.maxStores,
          maxNegocios: plan.maxNegocios,
          maxUsers: plan.maxUsers,
          maxProducts: plan.maxProducts,
          status: plan.status,
          updatedAt: plan.updatedAt,
        },
      });

      // 2. Atualiza cada preço individualmente
      for (const price of plan.prices) {
        await tx.planPrice.upsert({
          where: {
            planId_cycle: {
              planId: plan.id,
              cycle: price.cycle,
            },
          },
          update: {
            stripePriceId: price.stripePriceId,
            priceCents: price.priceCents,
            status: price.status ?? 'ACTIVE',
            updatedAt: new Date(),
          },
          create: {
            id: price.id,
            planId: plan.id,
            stripePriceId: price.stripePriceId,
            cycle: price.cycle,
            priceCents: price.priceCents,
            status: price.status ?? 'ACTIVE',
            createdAt: price.createdAt ?? new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // 3. Inativa PlanPrices cujo cycle não está mais no payload
      const activeCycles = plan.prices.map((p) => p.cycle);
      await tx.planPrice.deleteMany({
        where: {
          planId: plan.id,
          cycle: { notIn: activeCycles },
        },
      });

      // 4. Busca o plano com os preços atualizados
      const result = await tx.plan.findUnique({
        where: { id: plan.id },
        include: { prices: true },
      });

      if (!result) {
        throw new Error(`Plan with id ${plan.id} not found after save`);
      }

      return result;
    });

    return this.toEntity(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.plan.delete({ where: { id } });
  }

  private buildWhere(criteria?: PlanListCriteria): Prisma.PlanWhereInput {
    const conditions: Prisma.PlanWhereInput[] = [];

    if (criteria?.vertical) {
      conditions.push({ vertical: criteria.vertical });
    }

    if (criteria?.status) {
      if (Array.isArray(criteria.status)) {
        if (criteria.status.length > 0) {
          conditions.push({ status: { in: criteria.status } });
        }
      } else {
        conditions.push({ status: criteria.status });
      }
    }

    if (criteria?.billingCycle) {
      if (Array.isArray(criteria.billingCycle)) {
        if (criteria.billingCycle.length > 0) {
          conditions.push({
            prices: {
              some: {
                cycle: { in: criteria.billingCycle },
              },
            },
          });
        }
      } else {
        conditions.push({
          prices: {
            some: {
              cycle: criteria.billingCycle,
            },
          },
        });
      }
    }

    const search = criteria?.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (!conditions.length) return {};
    return { AND: conditions };
  }

  private toEntity(row: {
    id: string;
    code: string;
    name: string;
    description: string;
    vertical: string | null;
    tier: string | null;
    maxStores: number;
    maxNegocios: number | null;
    maxUsers: number;
    maxProducts: number | null;
    status: PlanStatus;
    createdAt: Date;
    updatedAt: Date;
    prices?: {
      id: string;
      planId: string;
      stripePriceId: string | null;
      cycle: string;
      priceCents: number;
      status: PlanStatus;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }): Plan {
    const props: PlanProps = {
      code: row.code,
      name: row.name,
      description: row.description,
      prices: (row.prices ?? []).map((p) => ({
        id: p.id,
        stripePriceId: p.stripePriceId,
        cycle: p.cycle as SubscriptionCycle,
        priceCents: p.priceCents,
        status: p.status,
        createdAt: p.createdAt,
      })),
      vertical: row.vertical,
      tier: row.tier,
      maxStores: row.maxStores,
      maxNegocios: row.maxNegocios,
      maxUsers: row.maxUsers,
      maxProducts: row.maxProducts,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Plan.with(props, row.id);
  }
}

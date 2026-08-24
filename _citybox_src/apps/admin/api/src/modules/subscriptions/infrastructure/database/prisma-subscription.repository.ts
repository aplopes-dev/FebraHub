import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { txClient } from '../../../../shared/infra/prisma/transaction.context';
import {
  SubscriptionRepository,
  type PlanPriceResult,
  type SubscriptionListCriteria,
} from '../../domain/repositories/subscription.repository.interface';
import {
  Subscription,
  type SubscriptionProps,
  type SubscriptionCycle,
  type SubscriptionStatus,
} from '../../domain/entities/subscription.entity';

const SUBSCRIPTION_INCLUDE = {
  planPrice: {
    select: {
      planId: true,
      priceCents: true,
      plan: { select: { name: true, vertical: true, tier: true } },
    },
  },
  store: {
    select: {
      tradeName: true,
      responsibleName: true,
    },
  },
} as const;

@Injectable()
export class PrismaSubscriptionRepository extends SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { id },
      include: SUBSCRIPTION_INCLUDE,
    });
    return row ? this.toEntity(row) : null;
  }

  async findActiveByStoreId(storeId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: {
        storeId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      orderBy: { createdAt: 'desc' },
      include: SUBSCRIPTION_INCLUDE,
    });
    return row ? this.toEntity(row) : null;
  }

  async findPriceByPlanAndCycle(
    planId: string,
    cycle: SubscriptionCycle,
  ): Promise<PlanPriceResult | null> {
    const row = await this.prisma.planPrice.findUnique({
      where: { planId_cycle: { planId, cycle } },
      select: { id: true, priceCents: true },
    });
    return row ? { id: row.id, priceCents: row.priceCents } : null;
  }

  async findByGatewaySubscriptionId(
    gatewaySubscriptionId: string,
  ): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { gatewaySubscriptionId },
      include: {
        planPrice: {
          select: {
            planId: true,
            priceCents: true,
            plan: { select: { name: true, vertical: true, tier: true } },
          },
        },
        store: {
          select: {
            tradeName: true,
            responsibleName: true,
          },
        },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria?: SubscriptionListCriteria): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: this.buildWhere(criteria),
      skip: criteria?.skip,
      take: criteria?.take,
      orderBy: { createdAt: 'desc' },
      include: SUBSCRIPTION_INCLUDE,
    });

    return rows.map((row) => this.toEntity(row));
  }

  async count(criteria?: SubscriptionListCriteria): Promise<number> {
    return this.prisma.subscription.count({ where: this.buildWhere(criteria) });
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const row = await txClient(this.prisma).subscription.upsert({
      where: { id: subscription.id },
      create: {
        id: subscription.id,
        storeId: subscription.storeId,
        planPriceId: subscription.planPriceId,
        cycle: subscription.cycle,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        dayOfMonth: subscription.dayOfMonth,
        gatewaySubscriptionId: subscription.gatewaySubscriptionId,
        canceledAt: subscription.canceledAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
      update: {
        storeId: subscription.storeId,
        planPriceId: subscription.planPriceId,
        cycle: subscription.cycle,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        dayOfMonth: subscription.dayOfMonth,
        gatewaySubscriptionId: subscription.gatewaySubscriptionId,
        canceledAt: subscription.canceledAt,
        updatedAt: subscription.updatedAt,
      },
      include: SUBSCRIPTION_INCLUDE,
    });
    return this.toEntity(row);
  }

  private buildWhere(
    criteria?: SubscriptionListCriteria,
  ): Prisma.SubscriptionWhereInput {
    const conditions: Prisma.SubscriptionWhereInput[] = [];

    if (criteria?.storeId) {
      conditions.push({ storeId: criteria.storeId });
    }

    if (criteria?.planPriceId) {
      conditions.push({ planPriceId: criteria.planPriceId });
    }

    if (criteria?.status?.length) {
      conditions.push({ status: { in: criteria.status } });
    }

    if (criteria?.periodStartFrom) {
      conditions.push({
        currentPeriodStart: { gte: criteria.periodStartFrom },
      });
    }

    if (criteria?.periodStartTo) {
      conditions.push({ currentPeriodStart: { lte: criteria.periodStartTo } });
    }

    if (!conditions.length) return {};
    return { AND: conditions };
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    planPriceId: string;
    planPrice?: {
      planId: string;
      priceCents: number;
      plan: { name: string; vertical: string | null; tier: string | null };
    };
    store?: { tradeName: string; responsibleName: string | null } | null;
    cycle: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    dayOfMonth: number;
    gatewaySubscriptionId: string | null;
    canceledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    const props: SubscriptionProps = {
      storeId: row.storeId,
      planPriceId: row.planPriceId,
      planId: row.planPrice?.planId,
      planName: row.planPrice?.plan?.name,
      planVertical: row.planPrice?.plan?.vertical,
      planTier: row.planPrice?.plan?.tier,
      priceCents: row.planPrice?.priceCents,
      cycle: row.cycle as SubscriptionCycle,
      status: row.status as SubscriptionStatus,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      dayOfMonth: row.dayOfMonth,
      gatewaySubscriptionId: row.gatewaySubscriptionId,
      canceledAt: row.canceledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // O "cliente" exibido é a própria loja desde o PLAT-001.
      clientName: row.store?.responsibleName ?? row.store?.tradeName,
    };
    return Subscription.with(props, row.id);
  }
}

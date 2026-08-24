import {
  SubscriptionRepository,
  type SubscriptionListCriteria,
  type PlanPriceResult,
} from '../domain/repositories/subscription.repository.interface';
import {
  Subscription,
  SubscriptionCycle,
} from '../domain/entities/subscription.entity';

export class InMemorySubscriptionRepository extends SubscriptionRepository {
  private items: Subscription[] = [];
  private prices: {
    planId: string;
    cycle: SubscriptionCycle;
    id: string;
    priceCents: number;
  }[] = [
    {
      planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cycle: 'MONTHLY',
      id: '11111111-1111-4111-a111-111111111111',
      priceCents: 9900,
    },
    {
      planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cycle: 'YEARLY',
      id: '11111111-1111-4111-a111-222222222222',
      priceCents: 99000,
    },
    {
      planId: '550e8400-e29b-41d4-a716-446655440000',
      cycle: 'MONTHLY',
      id: '22222222-2222-4222-b222-111111111111',
      priceCents: 14900,
    },
    {
      planId: '550e8400-e29b-41d4-a716-446655440000',
      cycle: 'YEARLY',
      id: '22222222-2222-4222-b222-222222222222',
      priceCents: 149000,
    },
    {
      planId: '550e8400-e29b-41d4-a716-446655440001',
      cycle: 'MONTHLY',
      id: '33333333-3333-4333-9333-111111111111',
      priceCents: 19900,
    },
    {
      planId: '550e8400-e29b-41d4-a716-446655440001',
      cycle: 'YEARLY',
      id: '33333333-3333-4333-9333-222222222222',
      priceCents: 199000,
    },
  ];

  async findById(id: string): Promise<Subscription | null> {
    return this.items.find((sub) => sub.id === id) ?? null;
  }

  async findPriceByPlanAndCycle(
    planId: string,
    cycle: 'MONTHLY' | 'YEARLY',
  ): Promise<PlanPriceResult | null> {
    const price = this.prices.find(
      (p) => p.planId === planId && p.cycle === cycle,
    );
    if (price) {
      return { id: price.id, priceCents: price.priceCents };
    }
    return null;
  }

  addPrice(
    planId: string,
    cycle: 'MONTHLY' | 'YEARLY',
    id: string,
    priceCents: number,
  ): void {
    this.prices.push({ planId, cycle, id, priceCents });
  }

  findActiveByStoreId(storeId: string): Promise<Subscription | null> {
    return Promise.resolve(
      this.items.find(
        (sub) =>
          sub.storeId === storeId &&
          ['ACTIVE', 'TRIALING'].includes(sub.status),
      ) ?? null,
    );
  }

  async findByGatewaySubscriptionId(
    gatewaySubscriptionId: string,
  ): Promise<Subscription | null> {
    return (
      this.items.find(
        (sub) => sub.gatewaySubscriptionId === gatewaySubscriptionId,
      ) ?? null
    );
  }

  async findAll(criteria?: SubscriptionListCriteria): Promise<Subscription[]> {
    let result = this.applyFilters(criteria);
    if (criteria?.skip) result = result.slice(criteria.skip);
    if (criteria?.take !== undefined) result = result.slice(0, criteria.take);
    return result;
  }

  async count(criteria?: SubscriptionListCriteria): Promise<number> {
    return this.applyFilters(criteria).length;
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const price = this.prices.find((p) => p.id === subscription.planPriceId);
    if (price) {
      subscription = Subscription.with(
        {
          ...subscription.props,
          planId: price.planId,
          priceCents: price.priceCents,
        },
        subscription.id,
      );
    }
    const index = this.items.findIndex((item) => item.id === subscription.id);
    if (index >= 0) {
      this.items[index] = subscription;
    } else {
      this.items.push(subscription);
    }
    return subscription;
  }

  getAll(): Subscription[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
    this.prices = [
      {
        planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        cycle: 'MONTHLY',
        id: '11111111-1111-4111-a111-111111111111',
        priceCents: 9900,
      },
      {
        planId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        cycle: 'YEARLY',
        id: '11111111-1111-4111-a111-222222222222',
        priceCents: 99000,
      },
      {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        cycle: 'MONTHLY',
        id: '22222222-2222-4222-b222-111111111111',
        priceCents: 14900,
      },
      {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        cycle: 'YEARLY',
        id: '22222222-2222-4222-b222-222222222222',
        priceCents: 149000,
      },
      {
        planId: '550e8400-e29b-41d4-a716-446655440001',
        cycle: 'MONTHLY',
        id: '33333333-3333-4333-9333-111111111111',
        priceCents: 19900,
      },
      {
        planId: '550e8400-e29b-41d4-a716-446655440001',
        cycle: 'YEARLY',
        id: '33333333-3333-4333-9333-222222222222',
        priceCents: 199000,
      },
    ];
  }

  private applyFilters(criteria?: SubscriptionListCriteria): Subscription[] {
    let result = [...this.items];

    if (criteria?.storeId) {
      result = result.filter((sub) => sub.storeId === criteria.storeId);
    }

    if (criteria?.planPriceId) {
      result = result.filter((sub) => sub.planPriceId === criteria.planPriceId);
    }

    if (criteria?.status?.length) {
      result = result.filter((sub) => criteria.status!.includes(sub.status));
    }

    if (criteria?.periodStartFrom) {
      result = result.filter(
        (sub) => sub.currentPeriodStart >= criteria.periodStartFrom!,
      );
    }

    if (criteria?.periodStartTo) {
      result = result.filter(
        (sub) => sub.currentPeriodStart <= criteria.periodStartTo!,
      );
    }

    return result;
  }
}

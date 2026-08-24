import type {
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export type PlanPriceResult = {
  id: string;
  priceCents: number;
};

export type SubscriptionListCriteria = {
  skip?: number;
  take?: number;
  storeId?: string;
  planPriceId?: string;
  status?: SubscriptionStatus[];
  periodStartFrom?: Date;
  periodStartTo?: Date;
};

export abstract class SubscriptionRepository {
  abstract findById(id: string): Promise<Subscription | null>;
  abstract findActiveByStoreId(storeId: string): Promise<Subscription | null>;
  abstract findPriceByPlanAndCycle(
    planId: string,
    cycle: SubscriptionCycle,
  ): Promise<PlanPriceResult | null>;
  abstract findByGatewaySubscriptionId(
    gatewaySubscriptionId: string,
  ): Promise<Subscription | null>;
  abstract findAll(
    criteria?: SubscriptionListCriteria,
  ): Promise<Subscription[]>;
  abstract count(criteria?: SubscriptionListCriteria): Promise<number>;
  abstract save(subscription: Subscription): Promise<Subscription>;
}

import { SubscriptionCycle } from '../../../subscriptions/domain/entities/subscription.entity';
import type { Plan, PlanStatus } from '../entities/plan.entity';

export type PlanListCriteria = {
  skip?: number;
  take?: number;
  search?: string;
  status?: PlanStatus | PlanStatus[];
  billingCycle?: SubscriptionCycle | SubscriptionCycle[];
  vertical?: string;
};

export abstract class PlanRepository {
  abstract findById(id: string): Promise<Plan | null>;
  abstract findByCode(code: string): Promise<Plan | null>;
  abstract findAll(criteria?: PlanListCriteria): Promise<Plan[]>;
  abstract count(criteria?: PlanListCriteria): Promise<number>;
  abstract countSubscribersByCode(code: string): Promise<number>;
  abstract save(plan: Plan): Promise<Plan>;
  abstract delete(id: string): Promise<void>;
}

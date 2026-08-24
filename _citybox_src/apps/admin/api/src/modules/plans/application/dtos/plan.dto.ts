import { SubscriptionCycle } from '../../../subscriptions/domain/entities/subscription.entity';
import { PlanStatus } from '../../domain/entities/plan.entity';

export interface PlanPriceInputDto {
  stripePriceId?: string | null;
  cycle: SubscriptionCycle;
  priceCents: number;
}

export interface CreatePlanDto {
  code: string;
  name: string;
  description: string;
  prices: PlanPriceInputDto[];
  vertical: string;
  tier: string;
  maxNegocios: number;
  maxUsers: number;
  maxProducts?: number | null;
}

export interface UpdatePlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  prices: PlanPriceInputDto[];
  vertical: string;
  tier: string;
  maxNegocios: number;
  maxUsers: number;
  maxProducts?: number | null;
  status: PlanStatus;
}

export interface FindPlanByIdDto {
  id: string;
}

export interface DeletePlanDto {
  id: string;
}

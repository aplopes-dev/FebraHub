import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PlanRepository } from '../../../domain/repositories/plan.repository.interface';
import type { Plan, PlanStatus } from '../../../domain/entities/plan.entity';
import { SubscriptionCycle } from '../../../../subscriptions/domain/entities/subscription.entity';

export interface ListPlansDto {
  page?: number;
  perPage?: number;
  search?: string;
  status?: PlanStatus | PlanStatus[];
  billingCycle?: SubscriptionCycle | SubscriptionCycle[];
  vertical?: string;
}

export interface PlanWithSubscribers {
  plan: Plan;
  subscriberCount: number;
}

export interface ListPlansResult {
  plans: PlanWithSubscribers[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

@Injectable()
export class ListPlansUseCase implements IUseCase<
  ListPlansDto,
  ListPlansResult
> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    search,
    status,
    billingCycle,
    vertical,
  }: ListPlansDto): Promise<ListPlansResult> {
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: search?.trim() || undefined,
      status: status,
      billingCycle: billingCycle,
      vertical: vertical?.trim() || undefined,
    };

    const [plans, total] = await Promise.all([
      this.planRepository.findAll(criteria),
      this.planRepository.count(criteria),
    ]);

    const plansWithSubscribers = await Promise.all(
      plans.map(async (plan) => ({
        plan,
        subscriberCount: await this.planRepository.countSubscribersByCode(
          plan.code,
        ),
      })),
    );

    return {
      plans: plansWithSubscribers,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}

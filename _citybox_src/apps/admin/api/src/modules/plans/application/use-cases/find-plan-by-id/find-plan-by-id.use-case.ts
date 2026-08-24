import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PlanRepository } from '../../../domain/repositories/plan.repository.interface';
import { Plan } from '../../../domain/entities/plan.entity';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';

export interface FindPlanByIdResult {
  plan: Plan;
  subscriberCount: number;
}

@Injectable()
export class FindPlanByIdUseCase implements IUseCase<
  string,
  FindPlanByIdResult
> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(id: string): Promise<FindPlanByIdResult> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new PlanNotFoundError(FindPlanByIdUseCase.name, id);
    }

    const subscriberCount = await this.planRepository.countSubscribersByCode(
      plan.code,
    );

    return { plan, subscriberCount };
  }
}

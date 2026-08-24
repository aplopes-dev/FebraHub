import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PlanRepository } from '../../../domain/repositories/plan.repository.interface';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanHasActiveSubscriptionsConflictError } from '../../../domain/errors/plan-has-active-subscriptions-conflict.error';

@Injectable()
export class DeletePlanUseCase implements IUseCase<string, void> {
  constructor(private readonly planRepository: PlanRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.planRepository.findById(id);
    if (!existing) {
      throw new PlanNotFoundError(DeletePlanUseCase.name, id);
    }

    const subscriberCount = await this.planRepository.countSubscribersByCode(
      existing.code,
    );
    if (subscriberCount > 0) {
      throw new PlanHasActiveSubscriptionsConflictError(
        DeletePlanUseCase.name,
        id,
        subscriberCount,
      );
    }

    await this.planRepository.delete(id);
  }
}

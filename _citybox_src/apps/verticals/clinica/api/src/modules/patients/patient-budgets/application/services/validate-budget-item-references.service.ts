import { Injectable } from '@nestjs/common';
import { ClinicPlanRepository } from '../../../../clinic-plans/domain/repositories/clinic-plan.repository.interface';
import { PatientPlanNotFoundError } from '../../../domain/errors/patient-plan-not-found.error';

export type BudgetItemReference = {
  planId: string;
  treatmentId: string;
};

export type ResolvedBudgetItemReference = {
  planName: string;
  treatmentName: string;
  acceptsFaces: boolean;
};

@Injectable()
export class ValidateBudgetItemReferencesService {
  constructor(private readonly planRepository: ClinicPlanRepository) {}

  async resolve(
    context: string,
    storeId: string,
    item: BudgetItemReference,
  ): Promise<ResolvedBudgetItemReference> {
    const aggregate = await this.planRepository.findAggregateById(
      storeId,
      item.planId,
    );
    if (!aggregate) {
      throw new PatientPlanNotFoundError(context, item.planId);
    }

    const treatment = aggregate.treatments.find(
      (entry) => entry.id === item.treatmentId && entry.planId === item.planId,
    );
    if (!treatment) {
      throw new PatientPlanNotFoundError(context, item.planId);
    }

    return {
      planName: aggregate.plan.name,
      treatmentName: treatment.name,
      acceptsFaces: treatment.acceptsFaces,
    };
  }
}

import type { ClinicPlan } from '../../../../domain/entities/clinic-plan.entity';
import type { ClinicPlanAggregate } from '../../../../domain/repositories/clinic-plan.repository.interface';
import {
  toClinicPlanDetailResponse,
  toClinicPlanSummaryResponse,
} from './clinic-plan-response.mapper';

export class ListClinicPlansPresenter {
  static toHttp(plans: ClinicPlan[]) {
    return { data: plans.map(toClinicPlanSummaryResponse) };
  }
}

export class ClinicPlanDetailPresenter {
  static toHttp(aggregate: ClinicPlanAggregate) {
    return { data: toClinicPlanDetailResponse(aggregate) };
  }
}

export class ClinicPlanSummaryPresenter {
  static toHttp(plan: ClinicPlan) {
    return { data: toClinicPlanSummaryResponse(plan) };
  }
}

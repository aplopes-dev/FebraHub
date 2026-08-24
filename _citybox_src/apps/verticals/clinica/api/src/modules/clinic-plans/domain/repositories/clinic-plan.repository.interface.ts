import type { ClinicPlan } from '../entities/clinic-plan.entity';
import type { ClinicPlanSpecialty } from '../entities/clinic-plan-specialty.entity';
import type { ClinicPlanTreatment } from '../entities/clinic-plan-treatment.entity';

export type ClinicPlanAggregate = {
  plan: ClinicPlan;
  specialties: ClinicPlanSpecialty[];
  treatments: ClinicPlanTreatment[];
};

export abstract class ClinicPlanRepository {
  abstract findByStoreId(storeId: string): Promise<ClinicPlan[]>;
  abstract findById(storeId: string, id: string): Promise<ClinicPlan | null>;
  abstract findDefaultActiveByStoreId(
    storeId: string,
  ): Promise<ClinicPlan | null>;
  abstract getMaxSortOrder(storeId: string): Promise<number>;
  abstract save(plan: ClinicPlan): Promise<ClinicPlan>;
  abstract clearDefaultForStore(
    storeId: string,
    exceptPlanId?: string,
  ): Promise<void>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countLinkedUsage(storeId: string, planId: string): Promise<number>;
  abstract findAggregateById(
    storeId: string,
    id: string,
  ): Promise<ClinicPlanAggregate | null>;
  abstract saveAggregate(
    aggregate: ClinicPlanAggregate,
  ): Promise<ClinicPlanAggregate>;
  abstract replaceTree(
    plan: ClinicPlan,
    specialties: ClinicPlanSpecialty[],
    treatments: ClinicPlanTreatment[],
  ): Promise<ClinicPlanAggregate>;
}

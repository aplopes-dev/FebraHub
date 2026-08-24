import type { ClinicPlan } from '../types/clinic-plan';

export function findActiveDefaultPlan(
  plans: ClinicPlan[],
  excludePlanId?: string,
): ClinicPlan | undefined {
  return plans.find(
    (plan) =>
      plan.isDefault && plan.status === 'active' && plan.id !== excludePlanId,
  );
}

import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';

export function resolveDefaultPlanId(plans: ClinicPlan[]): string {
  const markedDefault = plans.find((plan) => plan.isDefault);
  if (markedDefault) return markedDefault.id;

  return plans[0]?.id ?? '';
}

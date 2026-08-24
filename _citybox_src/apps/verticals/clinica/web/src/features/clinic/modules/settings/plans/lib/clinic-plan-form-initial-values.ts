import type { ClinicPlan } from '../types/clinic-plan';
import type { ClinicPlanFormData } from '../types/clinic-plan-form';

export const EMPTY_CLINIC_PLAN_FORM: ClinicPlanFormData = {
  name: '',
  status: 'active',
  isDefault: false,
  treatmentInit: '',
};

export function createClinicPlanFormFromPlan(plan: ClinicPlan): ClinicPlanFormData {
  return {
    name: plan.name,
    status: plan.status,
    isDefault: plan.isDefault,
    treatmentInit: plan.treatmentInit ?? '',
  };
}

export function createEmptyClinicPlanForm(): ClinicPlanFormData {
  return { ...EMPTY_CLINIC_PLAN_FORM };
}

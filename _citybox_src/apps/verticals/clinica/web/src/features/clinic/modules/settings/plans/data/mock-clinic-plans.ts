import type { ClinicPlan } from '../types/clinic-plan';
import type { ClinicPlanFormData, ClinicPlanSheetSuccessPayload } from '../types/clinic-plan-form';

export const MOCK_CLINIC_PLANS: ClinicPlan[] = [
  {
    id: 'plan-001',
    name: 'Plano Essencial',
    order: 1,
    status: 'active',
    isDefault: true,
    specialties: [],
  },
  {
    id: 'plan-002',
    name: 'Plano Plus',
    order: 2,
    status: 'active',
    isDefault: false,
    specialties: [],
  },
  {
    id: 'plan-003',
    name: 'Plano Premium',
    order: 3,
    status: 'active',
    isDefault: false,
    specialties: [],
  },
  {
    id: 'plan-004',
    name: 'Plano Família',
    order: 4,
    status: 'inactive',
    isDefault: false,
    specialties: [],
  },
  {
    id: 'plan-005',
    name: 'Plano Corporativo',
    order: 5,
    status: 'active',
    isDefault: false,
    specialties: [],
  },
];

function getNextPlanOrder(plans: ClinicPlan[]): number {
  if (plans.length === 0) {
    return 1;
  }

  return Math.max(...plans.map((plan) => plan.order)) + 1;
}

export function createClinicPlanFromForm(
  input: Pick<ClinicPlanFormData, 'name' | 'status'> &
    Pick<ClinicPlanSheetSuccessPayload, 'isDefault' | 'treatmentInit' | 'specialties'>,
  existingPlans: ClinicPlan[],
): ClinicPlan {
  return {
    id: `plan-${Date.now()}`,
    name: input.name.trim(),
    order: getNextPlanOrder(existingPlans),
    status: input.status,
    isDefault: input.isDefault ?? false,
    treatmentInit: input.treatmentInit,
    specialties: input.specialties,
  };
}

export function updateClinicPlanFromForm(
  plan: ClinicPlan,
  input: Pick<ClinicPlanFormData, 'name' | 'status'> &
    Pick<ClinicPlanSheetSuccessPayload, 'isDefault' | 'treatmentInit' | 'specialties'>,
): ClinicPlan {
  return {
    ...plan,
    name: input.name.trim(),
    status: input.status,
    isDefault: input.isDefault ?? plan.isDefault,
    treatmentInit: input.treatmentInit ?? plan.treatmentInit,
    specialties: input.specialties,
  };
}

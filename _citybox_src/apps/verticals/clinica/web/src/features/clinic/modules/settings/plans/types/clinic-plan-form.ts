import type { ClinicPlanStatus } from './clinic-plan';

import type { PlanSpecialtyItem } from './clinic-plan-specialty';

export const CLINIC_PLAN_TREATMENT_INIT_OPTIONS = ['copy-default', 'empty'] as const;

export type ClinicPlanTreatmentInit = (typeof CLINIC_PLAN_TREATMENT_INIT_OPTIONS)[number];

export type ClinicPlanFormData = {
  name: string;
  status: ClinicPlanStatus;
  isDefault: boolean;
  /** Vazio até o usuário escolher (somente na criação). */
  treatmentInit: ClinicPlanTreatmentInit | '';
};

export type ClinicPlanFormPatch = Partial<ClinicPlanFormData>;

export type ClinicPlanFormErrors = Partial<Record<'name' | 'treatmentInit', string>>;

export type ClinicPlanSheetSuccessPayload = {
  name: string;
  status: ClinicPlanStatus;
  isDefault?: boolean;
  treatmentInit?: ClinicPlanTreatmentInit;
  specialties: PlanSpecialtyItem[];
  planId?: string;
};

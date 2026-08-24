import type { ClinicPlanTreatmentInit } from './clinic-plan-form';
import type { PlanSpecialtyItem } from './clinic-plan-specialty';

export type ClinicPlanStatus = 'active' | 'inactive';

export type ClinicPlan = {
  id: string;
  name: string;
  order: number;
  status: ClinicPlanStatus;
  isDefault: boolean;
  treatmentInit?: ClinicPlanTreatmentInit;
  specialties: PlanSpecialtyItem[];
};

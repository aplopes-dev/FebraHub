import type { ClinicPlanTreatmentInit } from '../../domain/entities/clinic-plan.entity';
import type { ClinicPlanStatus } from '../../domain/entities/clinic-plan.entity';
import type { ClinicPlanAggregate } from '../../domain/repositories/clinic-plan.repository.interface';
import type { ClinicPlanLocationUiType } from '../../domain/types/clinic-plan-location-ui-type';

export type PlanTreatmentInput = {
  id?: string;
  name: string;
  valueCents: number;
  costCents: number;
  enabled: boolean;
  acceptsFaces: boolean;
  locationUiType?: ClinicPlanLocationUiType | null;
};

export type PlanSpecialtyInput = {
  id?: string;
  name: string;
  locationUiType?: ClinicPlanLocationUiType;
  treatments: PlanTreatmentInput[];
};

export type ListClinicPlansDto = {
  storeId: string;
};

export type GetClinicPlanByIdDto = {
  storeId: string;
  id: string;
};

export type CreateClinicPlanDto = {
  storeId: string;
  name: string;
  status: ClinicPlanStatus;
  isDefault: boolean;
  treatmentInit?: ClinicPlanTreatmentInit;
  specialties: PlanSpecialtyInput[];
};

export type UpdateClinicPlanDto = {
  storeId: string;
  id: string;
  name: string;
  status: ClinicPlanStatus;
  isDefault: boolean;
  specialties: PlanSpecialtyInput[];
};

export type UpdateClinicPlanStatusDto = {
  storeId: string;
  id: string;
  active: boolean;
};

export type DeleteClinicPlanDto = {
  storeId: string;
  id: string;
};

export type ClinicPlanDetailResult = ClinicPlanAggregate;

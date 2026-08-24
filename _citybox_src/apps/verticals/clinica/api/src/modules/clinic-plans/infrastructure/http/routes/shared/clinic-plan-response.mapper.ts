import type { ClinicPlan } from '../../../../domain/entities/clinic-plan.entity';
import type { ClinicPlanSpecialty } from '../../../../domain/entities/clinic-plan-specialty.entity';
import type { ClinicPlanTreatment } from '../../../../domain/entities/clinic-plan-treatment.entity';
import type { ClinicPlanAggregate } from '../../../../domain/repositories/clinic-plan.repository.interface';
import { formatCentsToBrl } from '../../../../application/utils/format-brl-currency';
import { mapTreatmentInitToHttp } from './clinic-plan-request.mapper';
import type { ClinicPlanLocationUiType } from '../../../../domain/types/clinic-plan-location-ui-type';

export type ClinicPlanSummaryResponse = {
  id: string;
  name: string;
  order: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  treatmentInit?: 'copy-default' | 'empty';
};

export type ClinicPlanTreatmentResponse = {
  id: string;
  name: string;
  treatmentValue: string;
  treatmentCost: string;
  enabled: boolean;
  acceptsFaces: boolean;
  locationUiType?: ClinicPlanLocationUiType | null;
};

export type ClinicPlanSpecialtyResponse = {
  id: string;
  name: string;
  locationUiType: ClinicPlanLocationUiType;
  treatments: ClinicPlanTreatmentResponse[];
};

export type ClinicPlanDetailResponse = ClinicPlanSummaryResponse & {
  specialties: ClinicPlanSpecialtyResponse[];
};

export function toClinicPlanSummaryResponse(
  plan: ClinicPlan,
): ClinicPlanSummaryResponse {
  return {
    id: plan.id,
    name: plan.name,
    order: plan.sortOrder,
    status: plan.status,
    isDefault: plan.isDefault,
    treatmentInit: mapTreatmentInitToHttp(plan.treatmentInit),
  };
}

export function toClinicPlanDetailResponse(
  aggregate: ClinicPlanAggregate,
): ClinicPlanDetailResponse {
  const treatmentsBySpecialty = groupTreatmentsBySpecialty(
    aggregate.treatments,
  );

  return {
    ...toClinicPlanSummaryResponse(aggregate.plan),
    specialties: aggregate.specialties.map((specialty) =>
      toClinicPlanSpecialtyResponse(
        specialty,
        treatmentsBySpecialty.get(specialty.id) ?? [],
      ),
    ),
  };
}

function groupTreatmentsBySpecialty(
  treatments: ClinicPlanTreatment[],
): Map<string, ClinicPlanTreatment[]> {
  const grouped = new Map<string, ClinicPlanTreatment[]>();
  for (const treatment of treatments) {
    const current = grouped.get(treatment.specialtyId) ?? [];
    grouped.set(treatment.specialtyId, [...current, treatment]);
  }
  for (const [specialtyId, specialtyTreatments] of grouped) {
    grouped.set(
      specialtyId,
      [...specialtyTreatments].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }
  return grouped;
}

function toClinicPlanSpecialtyResponse(
  specialty: ClinicPlanSpecialty,
  treatments: ClinicPlanTreatment[],
): ClinicPlanSpecialtyResponse {
  return {
    id: specialty.id,
    name: specialty.name,
    locationUiType: specialty.locationUiType,
    treatments: treatments.map(toClinicPlanTreatmentResponse),
  };
}

function toClinicPlanTreatmentResponse(
  treatment: ClinicPlanTreatment,
): ClinicPlanTreatmentResponse {
  return {
    id: treatment.id,
    name: treatment.name,
    treatmentValue: formatCentsToBrl(treatment.valueCents),
    treatmentCost: formatCentsToBrl(treatment.costCents),
    enabled: treatment.enabled,
    acceptsFaces: treatment.acceptsFaces,
    ...(treatment.locationUiType
      ? { locationUiType: treatment.locationUiType }
      : {}),
  };
}

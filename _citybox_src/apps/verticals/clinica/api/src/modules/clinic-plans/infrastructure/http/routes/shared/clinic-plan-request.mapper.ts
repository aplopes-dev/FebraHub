import type { ClinicPlanTreatmentInit } from '../../../../domain/entities/clinic-plan.entity';
import type {
  PlanSpecialtyBodyDto,
  PlanTreatmentBodyDto,
} from './clinic-plan.http-dto';
import type { PlanSpecialtyInput } from '../../../../application/dtos/clinic-plan.dto';
import { parseBrlToCents } from '../../../../application/utils/parse-brl-currency';

export function mapTreatmentInitFromHttp(
  value?: 'copy-default' | 'empty',
): ClinicPlanTreatmentInit | undefined {
  if (!value) return undefined;
  return value === 'copy-default' ? 'copy_default' : 'empty';
}

export function mapTreatmentInitToHttp(
  value: ClinicPlanTreatmentInit | null,
): 'copy-default' | 'empty' | undefined {
  if (!value) return undefined;
  return value === 'copy_default' ? 'copy-default' : 'empty';
}

export function mapSpecialtiesFromHttp(
  specialties: PlanSpecialtyBodyDto[],
): PlanSpecialtyInput[] {
  return specialties.map((specialty) => ({
    id: specialty.id,
    name: specialty.name,
    locationUiType: specialty.locationUiType,
    treatments: specialty.treatments.map((treatment) =>
      mapTreatmentFromHttp(treatment),
    ),
  }));
}

function mapTreatmentFromHttp(treatment: PlanTreatmentBodyDto) {
  return {
    id: treatment.id,
    name: treatment.name,
    valueCents: parseBrlToCents(
      treatment.treatmentValue,
      'PlanTreatmentBodyDto',
    ),
    costCents: parseBrlToCents(treatment.treatmentCost, 'PlanTreatmentBodyDto'),
    enabled: treatment.enabled,
    acceptsFaces: treatment.acceptsFaces ?? false,
    locationUiType: treatment.locationUiType ?? null,
  };
}

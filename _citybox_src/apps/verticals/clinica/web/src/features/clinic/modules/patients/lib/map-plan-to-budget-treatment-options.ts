import type { ClinicStrand } from '@citybox/messaging/clinic-strand';
import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import type { BudgetTreatmentOption } from '../data/mock-budget-treatments';
import { parseBrlCurrencyToCents } from './patient-budget-form-utils';
import { resolveEffectiveLocationUiType } from '../../settings/plans/data/specialty-location-ui-type';

export function mapPlanToBudgetTreatmentOptions(
  plan: ClinicPlan,
  clinicStrand?: ClinicStrand | null,
): BudgetTreatmentOption[] {
  return plan.specialties.flatMap((specialty) =>
    specialty.treatments
      .filter((treatment) => treatment.enabled)
      .map((treatment) => ({
        id: treatment.id,
        name: treatment.name,
        valueCents: parseBrlCurrencyToCents(treatment.treatmentValue),
        acceptsFaces: treatment.acceptsFaces === true,
        specialtyName: specialty.name,
        locationUiType: resolveEffectiveLocationUiType({
          specialtyLocationUiType: specialty.locationUiType,
          treatmentLocationUiType: treatment.locationUiType,
          specialtyName: specialty.name,
          clinicStrand,
        }),
      })),
  );
}

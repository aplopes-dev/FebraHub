import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import type { PatientBudget } from '../types/patient-budget';

export function buildTreatmentsDescriptionFromBudget(budget: PatientBudget): string {
  if (budget.treatments.length === 0) {
    return budget.description.trim();
  }
  return budget.treatments
    .map((item) => {
      const location = item.locationLabel?.trim();
      return location
        ? `${item.treatmentName} (${location})`
        : item.treatmentName;
    })
    .join('; ');
}

export function buildContractValueFromBudget(budget: PatientBudget): string {
  return formatBrlCurrencyFromCents(budget.finalValueCents).replace(/^R\$\s?/, '');
}

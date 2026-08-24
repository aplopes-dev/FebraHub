import { parseBrlCurrencyToCents } from './patient-budget-form-utils';
import type { PatientFinancialDebitTreatment } from '../types/patient-financial-debit-form';

export function sumPatientFinancialDebitTreatmentsCents(
  treatments: readonly PatientFinancialDebitTreatment[],
): number {
  return treatments.reduce(
    (total, treatment) => total + parseBrlCurrencyToCents(treatment.value),
    0,
  );
}

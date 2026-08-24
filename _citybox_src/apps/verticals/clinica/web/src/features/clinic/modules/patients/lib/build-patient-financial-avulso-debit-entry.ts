import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';
import { toIsoDateOnly } from './patient-document-date';
import { sumPatientFinancialDebitTreatmentsCents } from './sum-patient-financial-debit-treatments';

export function buildPatientFinancialAvulsoDebitEntryName(
  treatmentName: string,
  patientName: string,
): string {
  const trimmedTreatment = treatmentName.trim();
  const trimmedPatient = patientName.trim();

  if (!trimmedTreatment) {
    return trimmedPatient;
  }

  if (!trimmedPatient) {
    return trimmedTreatment;
  }

  return `${trimmedTreatment} de ${trimmedPatient}`;
}

export function buildPatientFinancialAvulsoDebitEntry(
  values: PatientFinancialDebitFormValues,
  patientName: string,
  existingEntry?: PatientFinancialEntry,
): PatientFinancialEntry | null {
  const firstTreatment = values.treatments[0];
  const treatmentName = firstTreatment?.treatmentName.trim() ?? '';

  if (!values.patientId || !values.dueDate || !treatmentName) {
    return null;
  }

  return {
    id: existingEntry?.id ?? crypto.randomUUID(),
    patientId: values.patientId,
    date: toIsoDateOnly(values.dueDate),
    name: buildPatientFinancialAvulsoDebitEntryName(treatmentName, patientName),
    valueCents: sumPatientFinancialDebitTreatmentsCents(values.treatments),
    status: existingEntry?.status ?? 'pending',
    receivedAt: existingEntry?.receivedAt,
    debitDetail: {
      observations: values.observations,
      treatments: values.treatments.map((treatment) => ({ ...treatment })),
    },
  };
}

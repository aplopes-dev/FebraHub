import { formatCentsToBrlInput } from './patient-budget-form-utils';
import { parseIsoDateString } from './patient-document-date';
import type { PatientFinancialDebitFormValues } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';

export function mapPatientFinancialEntryToDebitFormValues(
  entry: PatientFinancialEntry,
  patientId: string,
): PatientFinancialDebitFormValues {
  const treatments = entry.debitDetail?.treatments ?? [];

  return {
    patientId,
    dueDate: parseIsoDateString(entry.date) ?? null,
    observations: entry.debitDetail?.observations ?? '',
    treatments: treatments.map((treatment) => ({ ...treatment })),
    installmentValue:
      treatments.length === 0 ? formatCentsToBrlInput(entry.valueCents) : '',
    savedAttachments: entry.debitDetail?.attachments?.map((attachment) => ({
      ...attachment,
    })) ?? [],
    attachments: [],
  };
}

export function canEditPatientFinancialEntry(entry: PatientFinancialEntry): boolean {
  return entry.status === 'pending';
}

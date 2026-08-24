import type { PatientFinancialEntry } from '../types/patient-financial-entry';

function toNoonDate(value: string | Date): Date {
  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  return new Date(`${value}T12:00:00`);
}

/** Débito pendente com vencimento em hoje ou em data passada. */
export function isPatientFinancialEntryOverdue(
  entry: PatientFinancialEntry,
  referenceDate: Date = new Date(),
): boolean {
  if (entry.status !== 'pending') {
    return false;
  }

  const dueDate = toNoonDate(entry.date);
  const today = toNoonDate(referenceDate);

  return dueDate.getTime() <= today.getTime();
}

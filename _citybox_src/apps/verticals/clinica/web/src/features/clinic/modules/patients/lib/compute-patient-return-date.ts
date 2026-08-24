import type { PatientReturnAlertPeriod } from '../types/patient-return-alert';

function addMonths(baseDate: Date, months: number): Date {
  const result = new Date(baseDate);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function computePatientReturnDate(
  period: PatientReturnAlertPeriod,
  specificDate: Date | null,
  baseDate = new Date(),
): Date | null {
  switch (period) {
    case '1_month':
      return addMonths(baseDate, 1);
    case '6_months':
      return addMonths(baseDate, 6);
    case '12_months':
      return addMonths(baseDate, 12);
    case 'specific_date':
      return specificDate;
    default:
      return null;
  }
}

export function formatPatientReturnAlertDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function toPatientReturnAlertIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

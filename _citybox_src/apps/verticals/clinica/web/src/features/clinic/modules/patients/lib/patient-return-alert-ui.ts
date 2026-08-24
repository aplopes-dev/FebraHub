import type { CreateReturnAlertInput } from '@/features/clinic/agenda/api/return-alerts';
import type { PatientReturnAlertPeriod } from '../types/patient-return-alert';

export const PATIENT_RETURN_ALERT_PERIOD_OPTIONS: {
  value: PatientReturnAlertPeriod;
  label: string;
}[] = [
  { value: '1_month', label: '1 mês' },
  { value: '6_months', label: '6 meses' },
  { value: '12_months', label: '12 meses' },
  { value: 'specific_date', label: 'Data específica' },
];

export const patientPeriodToReturnOption: Record<
  PatientReturnAlertPeriod,
  CreateReturnAlertInput['returnOption']
> = {
  '1_month': 'one_month',
  '6_months': 'six_months',
  '12_months': 'twelve_months',
  specific_date: 'custom_date',
};

export function getPatientReturnAlertPeriodLabel(period: PatientReturnAlertPeriod): string {
  return (
    PATIENT_RETURN_ALERT_PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
    period
  );
}

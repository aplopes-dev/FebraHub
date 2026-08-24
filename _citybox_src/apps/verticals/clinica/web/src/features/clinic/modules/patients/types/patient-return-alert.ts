export type PatientReturnAlertPeriod =
  | '1_month'
  | '6_months'
  | '12_months'
  | 'specific_date';

export type PatientReturnAlert = {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  returnAt: string;
  period: PatientReturnAlertPeriod;
  reason: string;
};

export type PatientReturnAlertFormValues = {
  professionalId: string;
  period: PatientReturnAlertPeriod | '';
  specificDate: Date | null;
  reason: string;
};

export const EMPTY_PATIENT_RETURN_ALERT_FORM_VALUES: PatientReturnAlertFormValues = {
  professionalId: '',
  period: '',
  specificDate: null,
  reason: '',
};

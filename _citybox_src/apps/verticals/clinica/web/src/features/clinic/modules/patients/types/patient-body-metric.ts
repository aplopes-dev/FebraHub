export type PatientBodyMetric = {
  id: string;
  patientId: string;
  measuredAt: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  professionalId?: string;
  professionalName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientBodyMetricFormValues = {
  measuredAt: string;
  weightKg: string;
  heightCm: string;
  notes: string;
};

export const EMPTY_PATIENT_BODY_METRIC_FORM: PatientBodyMetricFormValues = {
  measuredAt: '',
  weightKg: '',
  heightCm: '',
  notes: '',
};

import type { PatientReferralSource } from '../types/patient-form';

export const PATIENT_REFERRAL_SOURCE_OPTIONS: Array<{
  value: PatientReferralSource;
  label: string;
}> = [
  { value: 'indicacao', label: 'Indicado por outro paciente' },
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'outro', label: 'Outro' },
];

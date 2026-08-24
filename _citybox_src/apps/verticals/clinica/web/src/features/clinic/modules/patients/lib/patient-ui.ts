import type { ClinicPatient, ClinicPatientStatus } from '../types/clinic-patient';
import type { PatientGender } from '../types/patient-form';

export const CLINIC_PATIENT_STATUS_LABEL: Record<ClinicPatientStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

export const CLINIC_PATIENT_STATUS_BADGE_CLASS: Record<ClinicPatientStatus, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  inactive: 'border-border bg-muted/50 text-muted-foreground',
};

export const PATIENT_GENDER_LABEL: Record<PatientGender, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
};

export function formatPatientReferralOriginLabel(
  patient: Pick<
    ClinicPatient,
    | 'referralOriginName'
    | 'referralOriginSystemKey'
    | 'referredByPatientName'
    | 'referredByMemberName'
    | 'referredByExternalProfessionalName'
  >,
): string {
  const originName = patient.referralOriginName?.trim();
  if (!originName) return '—';

  if (patient.referralOriginSystemKey === 'indicacao') {
    const referrer = patient.referredByPatientName?.trim();
    return referrer ? `${originName} — ${referrer}` : originName;
  }

  if (patient.referralOriginSystemKey === 'indicacao_profissional') {
    const referrer = patient.referredByMemberName?.trim();
    return referrer ? `${originName} — ${referrer}` : originName;
  }

  if (patient.referralOriginSystemKey === 'indicacao_profissional_externo') {
    const referrer = patient.referredByExternalProfessionalName?.trim();
    return referrer ? `${originName} — ${referrer}` : originName;
  }

  return originName;
}

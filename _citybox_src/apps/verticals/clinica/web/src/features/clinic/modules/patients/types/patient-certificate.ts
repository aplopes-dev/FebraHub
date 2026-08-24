import type { ProfessionalCouncilType } from '@citybox/messaging/professional-council';

export type PatientCertificateType = 'days' | 'attendance';

export type PatientCertificateFormValues = {
  professionalId: string;
  type: PatientCertificateType;
  issuedDate: string;
  daysCount: string;
  startTime: string;
  endTime: string;
  cid: string;
};

export type PatientCertificateFormErrors = Partial<
  Record<'professionalId' | 'issuedDate' | 'daysCount' | 'startTime' | 'endTime', string>
>;

export type PatientCertificateRecord = PatientCertificateFormValues & {
  id: string;
  patientId: string;
  patientName: string;
  professionalName: string;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  clinicName?: string;
  issuedAt: string;
};

export const EMPTY_PATIENT_CERTIFICATE_FORM_VALUES: PatientCertificateFormValues = {
  professionalId: '',
  type: 'days',
  issuedDate: '',
  daysCount: '',
  startTime: '',
  endTime: '',
  cid: '',
};

export function normalizePatientCertificateFormValues(
  values: Partial<PatientCertificateFormValues> = {},
): PatientCertificateFormValues {
  return {
    professionalId: values.professionalId ?? '',
    type: values.type ?? 'days',
    issuedDate: values.issuedDate ?? '',
    daysCount: values.daysCount ?? '',
    startTime: values.startTime ?? '',
    endTime: values.endTime ?? '',
    cid: values.cid ?? '',
  };
}

import type { PatientReferralOriginSystemKey } from './patient-referral-origin';

export type PatientGender = 'male' | 'female' | 'other';

/** @deprecated Prefer referralOriginId — kept for legacy mocks/dashboard until migrated */
export type PatientReferralSource =
  | 'indicacao'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'outro';

export type PatientFormValues = {
  name: string;
  gender: PatientGender | '';
  birthDate: string;
  cpf: string;
  rg: string;
  phone: string;
  referralOriginId: string;
  /** Sincronizado ao selecionar origem — usado na validação Zod. */
  referralOriginSystemKey: PatientReferralOriginSystemKey | '';
  referredByPatientId: string;
  referredByPatientName: string;
  referredByMemberId: string;
  referredByMemberName: string;
  referredByExternalProfessionalId: string;
  referredByExternalProfessionalName: string;
  categoryId: string;
  guardianName: string;
  guardianBirthDate: string;
  guardianCpf: string;
  guardianPhone: string;
  guardianNotes: string;
  email: string;
  landlinePhone: string;
  medicalRecordNumber: string;
  profession: string;
  socialNetwork: string;
  planId: string;
  planNumber: string;
  planHolderName: string;
  planHolderCpf: string;
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>;

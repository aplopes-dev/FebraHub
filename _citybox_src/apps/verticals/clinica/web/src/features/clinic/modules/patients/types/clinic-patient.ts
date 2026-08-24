import type { PatientGender } from './patient-form';
import type { PatientReferralOriginSystemKey } from './patient-referral-origin';

export type ClinicPatientStatus = 'active' | 'inactive';

export type PatientAboutSummary = {
  lastEvolution: string | null;
  appointments: string | null;
  messages: string | null;
};

export type PatientAddress = {
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type ClinicPatient = {
  id: string;
  name: string;
  photoUrl?: string | null;
  cpf: string;
  rg: string;
  phone: string;
  landlinePhone: string;
  birthDate: string;
  gender: PatientGender;
  email: string;
  profession: string;
  socialNetwork: string;
  medicalRecordNumber: string;
  referralOriginId: string | null;
  referralOriginName: string | null;
  referralOriginSystemKey: PatientReferralOriginSystemKey | null;
  referredByPatientId: string | null;
  referredByPatientName: string | null;
  referredByMemberId: string | null;
  referredByMemberName: string | null;
  referredByExternalProfessionalId: string | null;
  referredByExternalProfessionalName: string | null;
  guardianName: string;
  guardianBirthDate: string;
  guardianCpf: string;
  guardianPhone: string;
  guardianNotes: string;
  planName: string;
  /** Status do plano associado; `inactive` exibe "(Inativo)" na aba Sobre. */
  planStatus?: 'active' | 'inactive' | null;
  planNumber: string;
  planHolderName: string;
  planHolderCpf: string;
  categoryId: string;
  categoryName: string;
  categoryColorId: string;
  status: ClinicPatientStatus;
  address: PatientAddress;
  aboutSummary: PatientAboutSummary;
};

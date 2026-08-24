import type { PatientGender } from './patient-form';
import type { PatientReferralOriginSystemKey } from './patient-referral-origin';
import type { ClinicPatientStatus, PatientAboutSummary, PatientAddress } from './clinic-patient';

export type PatientReferralOriginApiItem = {
  id: string;
  name: string;
  systemKey: PatientReferralOriginSystemKey | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PatientApiListItem = {
  id: string;
  name: string;
  photoUrl: string | null;
  cpf: string;
  phone: string;
  birthDate: string;
  gender: PatientGender;
  email: string;
  profession: string;
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
  planName: string;
  planStatus?: 'active' | 'inactive' | null;
  categoryId: string;
  categoryName: string;
  categoryColorId: string;
  status: ClinicPatientStatus;
  address: PatientAddress;
  aboutSummary: PatientAboutSummary;
};

export type PatientApiFormItem = PatientApiListItem & {
  rg: string;
  landlinePhone: string;
  socialNetwork: string;
  guardianName: string;
  guardianBirthDate: string;
  guardianCpf: string;
  guardianPhone: string;
  guardianNotes: string;
  planId: string;
  planNumber: string;
  planHolderName: string;
  planHolderCpf: string;
};

export type PatientListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PatientListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  status?: ClinicPatientStatus;
  sortBy?: 'name' | 'birthDate' | 'status' | 'planName' | 'category';
  sortOrder?: 'asc' | 'desc';
};

export type PatientCategoryApiItem = {
  id: string;
  name: string;
  colorId: string;
  isProtected: boolean;
};

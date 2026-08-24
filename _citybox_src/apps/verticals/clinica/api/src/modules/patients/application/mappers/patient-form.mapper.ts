import {
  normalizeCpf,
  onlyDigits,
} from '../../../../shared/core/utils/brazilian-document.utils';
import type {
  PatientGender,
  PatientUpsertInput,
} from '../../domain/entities/patient.entity';

export type PatientFormInput = {
  name: string;
  gender: PatientGender;
  birthDate?: string;
  cpf?: string;
  rg?: string;
  phone?: string;
  referralOriginId?: string;
  referredByPatientId?: string;
  referredByMemberId?: string;
  referredByMemberName?: string;
  referredByExternalProfessionalId?: string;
  categoryId?: string;
  guardianName?: string;
  guardianBirthDate?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianNotes?: string;
  email?: string;
  landlinePhone?: string;
  medicalRecordNumber?: string;
  profession?: string;
  socialNetwork?: string;
  planId?: string;
  planNumber?: string;
  planHolderName?: string;
  planHolderCpf?: string;
  zipCode?: string;
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export function parseOptionalDate(value?: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateOnly(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}

export function normalizeOptionalCpf(value?: string): string | null {
  if (!value?.trim()) return null;
  return normalizeCpf(value);
}

export function normalizePhoneDigits(value?: string): string {
  return onlyDigits(value ?? '');
}

export function mapFormToPatientUpsertInput(
  input: PatientFormInput,
): PatientUpsertInput {
  const planId = input.planId?.trim();
  const referralOriginId = input.referralOriginId?.trim() || null;
  const referredByPatientId = input.referredByPatientId?.trim() || null;
  const referredByMemberId = input.referredByMemberId?.trim() || null;
  const referredByMemberName = input.referredByMemberName?.trim() || null;
  const referredByExternalProfessionalId =
    input.referredByExternalProfessionalId?.trim() || null;

  return {
    name: input.name.trim(),
    gender: input.gender,
    birthDate: parseOptionalDate(input.birthDate),
    cpf: normalizeOptionalCpf(input.cpf),
    rg: input.rg?.trim() ?? '',
    phone: normalizePhoneDigits(input.phone),
    referralOriginId,
    referredByPatientId,
    referredByMemberId,
    referredByMemberName,
    referredByExternalProfessionalId,
    categoryId: input.categoryId?.trim() ?? '',
    guardianName: input.guardianName?.trim() ?? '',
    guardianBirthDate: parseOptionalDate(input.guardianBirthDate),
    guardianCpf: normalizeOptionalCpf(input.guardianCpf),
    guardianPhone: normalizePhoneDigits(input.guardianPhone),
    guardianNotes: input.guardianNotes?.trim() ?? '',
    email: input.email?.trim() ?? '',
    landlinePhone: normalizePhoneDigits(input.landlinePhone),
    medicalRecordNumber: input.medicalRecordNumber?.trim() ?? '',
    profession: input.profession?.trim() ?? '',
    socialNetwork: input.socialNetwork?.trim() ?? '',
    planId: planId || null,
    planNumber: input.planNumber?.trim() ?? '',
    planHolderName: input.planHolderName?.trim() ?? '',
    planHolderCpf: normalizeOptionalCpf(input.planHolderCpf),
    zipCode: input.zipCode?.trim() ?? '',
    street: input.street?.trim() ?? '',
    streetNumber: input.streetNumber?.trim() ?? '',
    complement: input.complement?.trim() ?? '',
    neighborhood: input.neighborhood?.trim() ?? '',
    city: input.city?.trim() ?? '',
    state: input.state?.trim().toUpperCase().slice(0, 2) ?? '',
  };
}

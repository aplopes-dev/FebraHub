import type { PatientDetail } from '../../../../domain/repositories/patient.repository.interface';
import { formatDateOnly } from '../../../../application/mappers/patient-form.mapper';

export function toPatientResponse(detail: PatientDetail) {
  const {
    patient,
    planName,
    planStatus,
    categoryName,
    categoryColorId,
    referralOriginName,
    referralOriginSystemKey,
    referredByPatientName,
    referredByExternalProfessionalName,
  } = detail;

  return {
    id: patient.id,
    name: patient.name,
    photoUrl: patient.hasPhoto()
      ? `/api/v1/patients/${patient.id}/photo`
      : null,
    cpf: patient.cpf ?? '',
    phone: patient.phone,
    birthDate: formatDateOnly(patient.birthDate),
    gender: patient.gender,
    email: patient.email,
    profession: patient.profession,
    medicalRecordNumber: patient.medicalRecordNumber,
    referralOriginId: patient.referralOriginId,
    referralOriginName,
    referralOriginSystemKey,
    referredByPatientId: patient.referredByPatientId,
    referredByPatientName,
    referredByMemberId: patient.referredByMemberId,
    referredByMemberName: patient.referredByMemberName,
    referredByExternalProfessionalId: patient.referredByExternalProfessionalId,
    referredByExternalProfessionalName,
    planName: planName ?? '',
    planStatus: planStatus,
    categoryId: patient.categoryId,
    categoryName,
    categoryColorId,
    status: patient.status,
    address: {
      zipCode: patient.zipCode,
      street: patient.street,
      streetNumber: patient.streetNumber,
      complement: patient.complement,
      neighborhood: patient.neighborhood,
      city: patient.city,
      state: patient.state,
    },
    aboutSummary: {
      lastEvolution: null,
      appointments: null,
      messages: null,
    },
  };
}

export function toPatientFormResponse(detail: PatientDetail) {
  const base = toPatientResponse(detail);
  const { patient } = detail;

  return {
    ...base,
    rg: patient.rg,
    landlinePhone: patient.landlinePhone,
    socialNetwork: patient.socialNetwork,
    categoryId: patient.categoryId,
    guardianName: patient.guardianName,
    guardianBirthDate: formatDateOnly(patient.guardianBirthDate),
    guardianCpf: patient.guardianCpf ?? '',
    guardianPhone: patient.guardianPhone,
    guardianNotes: patient.guardianNotes,
    planId: patient.planId ?? '',
    planNumber: patient.planNumber,
    planHolderName: patient.planHolderName,
    planHolderCpf: patient.planHolderCpf ?? '',
  };
}

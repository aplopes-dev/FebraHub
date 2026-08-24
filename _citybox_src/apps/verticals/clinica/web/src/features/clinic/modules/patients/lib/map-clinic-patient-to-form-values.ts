import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import type { ClinicPatient } from '../types/clinic-patient';
import { PATIENT_FORM_INITIAL_VALUES } from './patient-form-initial-values';
import type { PatientFormValues } from '../types/patient-form';

export function mapClinicPatientToFormValues(
  patient: ClinicPatient,
  plans: ClinicPlan[] = [],
  formOverrides?: Partial<PatientFormValues>,
): PatientFormValues {
  const matchedPlan = plans.find((plan) => plan.name === patient.planName);

  return {
    ...PATIENT_FORM_INITIAL_VALUES,
    name: patient.name,
    birthDate: patient.birthDate,
    cpf: patient.cpf,
    rg: patient.rg,
    phone: patient.phone,
    landlinePhone: patient.landlinePhone,
    gender: patient.gender,
    email: patient.email,
    profession: patient.profession,
    socialNetwork: patient.socialNetwork,
    medicalRecordNumber: patient.medicalRecordNumber,
    referralOriginId: patient.referralOriginId ?? '',
    referralOriginSystemKey: patient.referralOriginSystemKey ?? '',
    referredByPatientId: patient.referredByPatientId ?? '',
    referredByPatientName: patient.referredByPatientName ?? '',
    referredByMemberId: patient.referredByMemberId ?? '',
    referredByMemberName: patient.referredByMemberName ?? '',
    referredByExternalProfessionalId:
      patient.referredByExternalProfessionalId ?? '',
    referredByExternalProfessionalName:
      patient.referredByExternalProfessionalName ?? '',
    guardianName: patient.guardianName,
    guardianBirthDate: patient.guardianBirthDate,
    guardianCpf: patient.guardianCpf,
    guardianPhone: patient.guardianPhone,
    guardianNotes: patient.guardianNotes,
    categoryId: patient.categoryId,
    planId: matchedPlan?.id ?? '',
    planNumber: patient.planNumber,
    planHolderName: patient.planHolderName,
    planHolderCpf: patient.planHolderCpf,
    zipCode: patient.address.zipCode,
    street: patient.address.street,
    streetNumber: patient.address.streetNumber,
    complement: patient.address.complement,
    neighborhood: patient.address.neighborhood,
    city: patient.address.city,
    state: patient.address.state,
    ...formOverrides,
  };
}

import type { ZodError } from 'zod';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';

export type PatientFormTabId = 'additional' | 'plan' | 'address';

export type PatientFormValidationResult =
  | { valid: true }
  | { valid: false; errors: PatientFormErrors };

export const PATIENT_FORM_FIELD_ORDER: Array<keyof PatientFormValues> = [
  'name',
  'gender',
  'birthDate',
  'cpf',
  'rg',
  'phone',
  'referralOriginId',
  'referralOriginSystemKey',
  'referredByPatientId',
  'referredByPatientName',
  'referredByMemberId',
  'referredByMemberName',
  'referredByExternalProfessionalId',
  'referredByExternalProfessionalName',
  'categoryId',
  'guardianName',
  'guardianBirthDate',
  'guardianCpf',
  'guardianPhone',
  'guardianNotes',
  'email',
  'landlinePhone',
  'medicalRecordNumber',
  'profession',
  'socialNetwork',
  'planId',
  'planNumber',
  'planHolderName',
  'planHolderCpf',
  'zipCode',
  'street',
  'streetNumber',
  'complement',
  'neighborhood',
  'city',
  'state',
];

export const PATIENT_FORM_FIELD_LABELS: Record<keyof PatientFormValues, string> = {
  name: 'Nome do paciente',
  gender: 'Sexo',
  birthDate: 'Data de nascimento',
  cpf: 'CPF',
  rg: 'RG',
  phone: 'Celular',
  referralOriginId: 'Como chegou à clínica',
  referralOriginSystemKey: 'Origem do paciente',
  referredByPatientId: 'Paciente que indicou',
  referredByPatientName: 'Nome do paciente que indicou',
  referredByMemberId: 'Profissional que indicou',
  referredByMemberName: 'Nome do profissional que indicou',
  referredByExternalProfessionalId: 'Profissional externo que indicou',
  referredByExternalProfessionalName: 'Nome do profissional externo',
  categoryId: 'Categoria',
  guardianName: 'Nome do responsável',
  guardianBirthDate: 'Data de nascimento do responsável',
  guardianCpf: 'CPF do responsável',
  guardianPhone: 'Celular do responsável',
  guardianNotes: 'Observação do responsável',
  email: 'E-mail',
  landlinePhone: 'Telefone',
  medicalRecordNumber: 'Número do prontuário',
  profession: 'Profissão',
  socialNetwork: 'Rede social',
  planId: 'Plano',
  planNumber: 'Número do plano',
  planHolderName: 'Titular do plano',
  planHolderCpf: 'CPF do titular do plano',
  zipCode: 'CEP',
  street: 'Rua',
  streetNumber: 'Número',
  complement: 'Complemento',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
};

export const PATIENT_FORM_FIELD_TAB: Partial<Record<keyof PatientFormValues, PatientFormTabId>> = {
  email: 'additional',
  landlinePhone: 'additional',
  medicalRecordNumber: 'additional',
  profession: 'additional',
  socialNetwork: 'additional',
  planId: 'plan',
  planNumber: 'plan',
  planHolderName: 'plan',
  planHolderCpf: 'plan',
  zipCode: 'address',
  street: 'address',
  streetNumber: 'address',
  complement: 'address',
  neighborhood: 'address',
  city: 'address',
  state: 'address',
};

export const PATIENT_FORM_FIELD_ELEMENT_ID: Partial<Record<keyof PatientFormValues, string>> = {
  name: 'patient-name',
  gender: 'patient-gender-male',
  birthDate: 'patient-birth-date',
  cpf: 'patient-cpf',
  rg: 'patient-rg',
  phone: 'patient-phone',
  referralOriginId: 'patient-referral-origin',
  referredByPatientId: 'patient-referred-by-patient',
  referredByMemberId: 'patient-referred-by-member',
  referredByExternalProfessionalId: 'patient-external-professional',
  guardianName: 'guardian-name',
  guardianBirthDate: 'guardian-birth-date',
  guardianCpf: 'guardian-cpf',
  guardianPhone: 'guardian-phone',
  guardianNotes: 'guardian-notes',
  email: 'patient-email',
  landlinePhone: 'patient-landline',
  medicalRecordNumber: 'patient-medical-record',
  profession: 'patient-profession',
  socialNetwork: 'patient-social-network',
  planId: 'patient-plan',
  planNumber: 'patient-plan-number',
  planHolderName: 'patient-plan-holder',
  planHolderCpf: 'patient-plan-holder-cpf',
  zipCode: 'patient-zip-code',
  street: 'patient-street',
  streetNumber: 'patient-street-number',
  complement: 'patient-complement',
  neighborhood: 'patient-neighborhood',
  city: 'patient-city',
  state: 'patient-state',
};

export function mapZodIssuesToPatientFormErrors(error: ZodError): PatientFormErrors {
  const mapped: PatientFormErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string') continue;
    const key = field as keyof PatientFormValues;
    if (!mapped[key]) {
      mapped[key] = issue.message;
    }
  }

  return mapped;
}

export function getFirstPatientFormErrorField(
  errors: PatientFormErrors,
): keyof PatientFormValues | undefined {
  return PATIENT_FORM_FIELD_ORDER.find((field) => Boolean(errors[field]));
}

export function buildPatientFormValidationToastMessage(errors: PatientFormErrors): string {
  const fields = PATIENT_FORM_FIELD_ORDER.filter((field) => Boolean(errors[field]));

  if (fields.length === 0) {
    return 'Verifique os campos obrigatórios antes de salvar.';
  }

  if (fields.length === 1) {
    const field = fields[0]!;
    return errors[field] ?? `Verifique o campo ${PATIENT_FORM_FIELD_LABELS[field]}.`;
  }

  const summary = fields
    .slice(0, 3)
    .map((field) => PATIENT_FORM_FIELD_LABELS[field])
    .join(', ');

  if (fields.length > 3) {
    return `Corrija os campos: ${summary} e mais ${fields.length - 3}.`;
  }

  return `Corrija os campos: ${summary}.`;
}

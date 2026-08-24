import type { PatientCertificateFormValues } from '../types/patient-certificate';
import type { PatientCertificateFormErrors } from '../types/patient-certificate';

export function validatePatientCertificateForm(
  values: PatientCertificateFormValues,
): PatientCertificateFormErrors {
  const errors: PatientCertificateFormErrors = {};

  if (!values.professionalId.trim()) {
    errors.professionalId = 'Selecione o profissional.';
  }

  if (!values.issuedDate.trim()) {
    errors.issuedDate = 'Informe a data do atestado.';
  }

  if (values.type === 'days') {
    const daysCount = values.daysCount ?? '';
    const days = Number(daysCount);
    if (!daysCount.trim() || Number.isNaN(days) || days <= 0) {
      errors.daysCount = 'Informe a quantidade de dias maior que zero.';
    }
  }

  if (values.type === 'attendance') {
    const startTime = values.startTime ?? '';
    const endTime = values.endTime ?? '';

    if (!startTime.trim()) {
      errors.startTime = 'Informe a hora inicial.';
    }

    if (!endTime.trim()) {
      errors.endTime = 'Informe a hora final.';
    }

    if (startTime.trim() && endTime.trim() && endTime <= startTime) {
      errors.endTime = 'A hora final deve ser posterior à hora inicial.';
    }
  }

  return errors;
}

export function hasPatientCertificateFormErrors(errors: PatientCertificateFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

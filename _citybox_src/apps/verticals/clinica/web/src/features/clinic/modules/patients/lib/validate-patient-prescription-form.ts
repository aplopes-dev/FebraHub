import type { PatientPrescriptionFormValues } from '../types/patient-prescription';
import type { PatientPrescriptionFormErrors } from '../types/patient-prescription';

export function validatePatientPrescriptionForm(
  values: PatientPrescriptionFormValues,
): PatientPrescriptionFormErrors {
  const errors: PatientPrescriptionFormErrors = {};

  if (!values.professionalId.trim()) {
    errors.professionalId = 'Selecione o profissional.';
  }

  if (!values.issuedDate.trim()) {
    errors.issuedDate = 'Informe a data do receituário.';
  }

  if (values.items.length === 0) {
    errors.items = 'Adicione ao menos um medicamento.';
  }

  return errors;
}

export function hasPatientPrescriptionFormErrors(errors: PatientPrescriptionFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

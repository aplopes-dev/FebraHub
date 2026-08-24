import type { PatientTreatmentFinalizeFormValues } from '../types/patient-treatment';

export type PatientTreatmentFinalizeFormErrors = {
  professionalId?: string;
  finalizedDate?: string;
  evolutionNotes?: string;
};

export function validatePatientTreatmentFinalizeForm(
  values: PatientTreatmentFinalizeFormValues,
): PatientTreatmentFinalizeFormErrors {
  const errors: PatientTreatmentFinalizeFormErrors = {};

  if (!values.professionalId.trim()) {
    errors.professionalId = 'Selecione o profissional.';
  }

  if (!values.finalizedDate) {
    errors.finalizedDate = 'Selecione a data.';
  }

  if (!values.evolutionNotes.trim()) {
    errors.evolutionNotes = 'Descreva a evolução do procedimento.';
  }

  return errors;
}

export function hasPatientTreatmentFinalizeFormErrors(
  errors: PatientTreatmentFinalizeFormErrors,
): boolean {
  return Object.keys(errors).length > 0;
}

import type { PatientStandaloneEvolutionFormValues } from '../types/patient-treatment';

export type PatientStandaloneEvolutionFormErrors = {
  professionalId?: string;
  evolutionDate?: string;
  evolutionNotes?: string;
};

export function validatePatientStandaloneEvolutionForm(
  values: PatientStandaloneEvolutionFormValues,
): PatientStandaloneEvolutionFormErrors {
  const errors: PatientStandaloneEvolutionFormErrors = {};

  if (!values.professionalId.trim()) {
    errors.professionalId = 'Selecione o profissional.';
  }

  if (!values.evolutionDate) {
    errors.evolutionDate = 'Selecione a data.';
  }

  if (!values.evolutionNotes.trim()) {
    errors.evolutionNotes = 'Descreva a evolução clínica.';
  }

  return errors;
}

export function hasPatientStandaloneEvolutionFormErrors(
  errors: PatientStandaloneEvolutionFormErrors,
): boolean {
  return Object.keys(errors).length > 0;
}

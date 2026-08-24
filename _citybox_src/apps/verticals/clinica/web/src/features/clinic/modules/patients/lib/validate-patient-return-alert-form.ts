import { computePatientReturnDate } from './compute-patient-return-date';
import type { PatientReturnAlertFormValues } from '../types/patient-return-alert';

export type PatientReturnAlertFormErrors = Partial<
  Record<'professionalId' | 'period' | 'specificDate' | 'reason', string>
>;

export function validatePatientReturnAlertForm(
  values: PatientReturnAlertFormValues,
): PatientReturnAlertFormErrors {
  const errors: PatientReturnAlertFormErrors = {};

  if (!values.professionalId.trim()) {
    errors.professionalId = 'Selecione o profissional.';
  }

  if (!values.period) {
    errors.period = 'Selecione quando o paciente deve retornar.';
  }

  if (values.period === 'specific_date' && !values.specificDate) {
    errors.specificDate = 'Informe a data de retorno.';
  }

  const returnDate = values.period
    ? computePatientReturnDate(values.period, values.specificDate)
    : null;

  if (values.period && values.period !== 'specific_date' && !returnDate) {
    errors.period = 'Período de retorno inválido.';
  }

  if (!values.reason.trim()) {
    errors.reason = 'Informe o motivo do retorno.';
  }

  return errors;
}

export function hasPatientReturnAlertFormErrors(
  errors: PatientReturnAlertFormErrors,
): boolean {
  return Object.keys(errors).length > 0;
}

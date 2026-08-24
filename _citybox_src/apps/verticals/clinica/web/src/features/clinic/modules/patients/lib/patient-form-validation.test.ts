import { describe, expect, it } from 'vitest';
import {
  buildPatientFormValidationToastMessage,
  getFirstPatientFormErrorField,
} from './patient-form-validation';

describe('patient-form-validation', () => {
  it('returns the field message for a single error', () => {
    expect(
      buildPatientFormValidationToastMessage({
        name: 'Informe o nome do paciente.',
      }),
    ).toBe('Informe o nome do paciente.');
  });

  it('lists multiple field labels in toast summary', () => {
    expect(
      buildPatientFormValidationToastMessage({
        name: 'Informe o nome do paciente.',
        cpf: 'CPF inválido.',
      }),
    ).toBe('Corrija os campos: Nome do paciente, CPF.');
  });

  it('picks the first error field in form order', () => {
    expect(
      getFirstPatientFormErrorField({
        email: 'E-mail inválido.',
        name: 'Informe o nome do paciente.',
      }),
    ).toBe('name');
  });
});

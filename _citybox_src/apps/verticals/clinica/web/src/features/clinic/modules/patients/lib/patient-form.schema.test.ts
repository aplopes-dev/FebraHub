import { describe, expect, it } from 'vitest';
import { PATIENT_FORM_INITIAL_VALUES } from './patient-form-initial-values';
import { patientFormSchema } from './patient-form.schema';

describe('patientFormSchema', () => {
  it('requires only the patient name', () => {
    const result = patientFormSchema.safeParse({
      ...PATIENT_FORM_INITIAL_VALUES,
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'name')).toBe(true);
      expect(result.error.issues.some((issue) => issue.path[0] === 'gender')).toBe(false);
    }
  });

  it('accepts a minimal valid payload with default gender', () => {
    const result = patientFormSchema.safeParse({
      ...PATIENT_FORM_INITIAL_VALUES,
      name: 'Paciente Teste',
      gender: 'male',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid cpf when provided', () => {
    const result = patientFormSchema.safeParse({
      ...PATIENT_FORM_INITIAL_VALUES,
      name: 'Paciente Teste',
      cpf: '111.111.111-11',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'cpf')).toBe(true);
    }
  });

  it('requires external professional when systemKey is indicacao_profissional_externo', () => {
    const result = patientFormSchema.safeParse({
      ...PATIENT_FORM_INITIAL_VALUES,
      name: 'Paciente Teste',
      referralOriginId: 'origin-ext',
      referralOriginSystemKey: 'indicacao_profissional_externo',
      referredByExternalProfessionalId: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === 'referredByExternalProfessionalId',
        ),
      ).toBe(true);
    }
  });

  it('accepts external professional when required', () => {
    const result = patientFormSchema.safeParse({
      ...PATIENT_FORM_INITIAL_VALUES,
      name: 'Paciente Teste',
      referralOriginId: 'origin-ext',
      referralOriginSystemKey: 'indicacao_profissional_externo',
      referredByExternalProfessionalId: 'prof-1',
      referredByExternalProfessionalName: 'Dr. Externo',
    });

    expect(result.success).toBe(true);
  });
});

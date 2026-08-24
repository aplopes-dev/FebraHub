import { describe, expect, it } from 'vitest';
import { formatPatientHeaderContactLine } from './format-patient-contact';

describe('formatPatientHeaderContactLine', () => {
  it('joins phone and cpf with a dash only when both exist', () => {
    expect(formatPatientHeaderContactLine('73999887766', '12345678901')).toBe(
      '(73) 99988-7766 - CPF: 123.456.789-01',
    );
  });

  it('omits the leading dash when the patient has only cpf', () => {
    expect(formatPatientHeaderContactLine('', '12345678901')).toBe('CPF: 123.456.789-01');
    expect(formatPatientHeaderContactLine('   ', '12345678901')).toBe('CPF: 123.456.789-01');
  });

  it('returns only the phone when cpf is missing', () => {
    expect(formatPatientHeaderContactLine('73999887766', '')).toBe('(73) 99988-7766');
  });
});

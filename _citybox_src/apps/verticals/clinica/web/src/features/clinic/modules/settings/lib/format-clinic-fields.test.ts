import { describe, expect, it } from 'vitest';
import {
  isValidCnpj,
  validateClinicSettingsFields,
} from './format-clinic-fields';

describe('isValidCnpj', () => {
  it('accepts a valid CNPJ', () => {
    expect(isValidCnpj('04.252.011/0001-10')).toBe(true);
  });

  it('rejects repeated digits', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('rejects wrong checksum with 14 digits', () => {
    expect(isValidCnpj('12345678901234')).toBe(false);
  });
});

describe('validateClinicSettingsFields', () => {
  it('returns CNPJ inválido for bad document', () => {
    const errors = validateClinicSettingsFields({
      cnpj: '11.111.111/1111-11',
      email: '',
      cep: '',
    });
    expect(errors.cnpj).toBe('CNPJ inválido.');
  });
});

import { describe, expect, it } from 'vitest';
import { formatCnpj, isValidCnpj, normalizeCnpjDigits } from './cnpj';

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

describe('formatCnpj', () => {
  it('formats full CNPJ mask', () => {
    expect(formatCnpj('04252011000110')).toBe('04.252.011/0001-10');
  });
});

describe('normalizeCnpjDigits', () => {
  it('strips non-digits', () => {
    expect(normalizeCnpjDigits('04.252.011/0001-10')).toBe('04252011000110');
  });
});

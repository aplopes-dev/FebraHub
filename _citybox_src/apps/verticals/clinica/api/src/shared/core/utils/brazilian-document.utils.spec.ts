import {
  isValidCnpj,
  isValidCpf,
  normalizeCpf,
  onlyDigits,
} from './brazilian-document.utils';

describe('brazilian-document.utils', () => {
  it('onlyDigits removes non-digits', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901');
  });

  it('normalizeCpf returns null for empty', () => {
    expect(normalizeCpf('')).toBeNull();
    expect(normalizeCpf('   ')).toBeNull();
  });

  it('validates known valid CPF', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('rejects invalid CPF checksum', () => {
    expect(isValidCpf('12345678901')).toBe(false);
  });

  it('rejects repeated digits CPF', () => {
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('validates known valid CNPJ', () => {
    expect(isValidCnpj('04.252.011/0001-10')).toBe(true);
  });

  it('rejects invalid CNPJ checksum', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('rejects repeated digits CNPJ', () => {
    expect(isValidCnpj('00000000000000')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { isValidCpf, normalizeCpf, onlyDigits } from './brazilian-document.utils';

describe('brazilian-document.utils', () => {
  it('normalizes cpf to digits only', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });

  it('validates known valid cpfs', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('rejects invalid cpfs', () => {
    expect(isValidCpf('12345678901')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });
});

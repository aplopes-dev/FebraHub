import { describe, expect, it } from 'vitest';
import {
  digitsOnly,
  formatCpf,
  formatCpfDisplay,
  isValidCpf,
  normalizeCpfDigits,
} from './cpf';

describe('shared/fiscal/cpf', () => {
  it('normalizes cpf to digits only', () => {
    expect(digitsOnly('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpfDigits('529.982.247-25')).toBe('52998224725');
  });

  it('formats cpf as the user types', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('529982')).toBe('529.982');
    expect(formatCpf('529982247')).toBe('529.982.247');
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('formats display for complete cpf', () => {
    expect(formatCpfDisplay('52998224725')).toBe('529.982.247-25');
  });

  it('validates known valid cpfs', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejects invalid cpfs', () => {
    expect(isValidCpf('12345678901')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });
});

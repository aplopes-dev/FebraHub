import { describe, expect, it } from 'vitest';
import { formatAssinaturaPrice } from './format-assinatura-price';

describe('formatAssinaturaPrice', () => {
  it('formata com duas casas no padrão pt-BR', () => {
    expect(formatAssinaturaPrice(99.9)).toBe('99,90');
    expect(formatAssinaturaPrice(199.9)).toBe('199,90');
    expect(formatAssinaturaPrice(299.9)).toBe('299,90');
  });

  it('formata inteiros com ,00', () => {
    expect(formatAssinaturaPrice(100)).toBe('100,00');
  });
});

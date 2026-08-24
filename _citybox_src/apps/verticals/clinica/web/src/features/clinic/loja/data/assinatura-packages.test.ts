import { describe, expect, it } from 'vitest';
import { ASSINATURA_PACKAGES } from './assinatura-packages';

describe('ASSINATURA_PACKAGES', () => {
  it('expõe exatamente 3 pacotes com qty e preço corretos', () => {
    expect(ASSINATURA_PACKAGES).toHaveLength(3);
    expect(ASSINATURA_PACKAGES.map((p) => p.quantity)).toEqual([
      250, 600, 1000,
    ]);
    expect(ASSINATURA_PACKAGES.map((p) => p.priceReais)).toEqual([
      99.9, 199.9, 299.9,
    ]);
  });
});

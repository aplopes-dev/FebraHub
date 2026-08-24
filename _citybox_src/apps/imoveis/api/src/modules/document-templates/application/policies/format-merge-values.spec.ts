import { formatBRL, formatCentsBRL, joinAddress } from './format-merge-values';

describe('format-merge-values', () => {
  it('formata BRL e endereço concatenado', () => {
    expect(formatBRL(450000)).toContain('450.000');
    expect(formatCentsBRL(250000)).toContain('2.500');
    expect(joinAddress(['Rua das Flores, 10', 'Ilhéus', 'BA'])).toBe(
      'Rua das Flores, 10, Ilhéus, BA',
    );
  });
});

import { normalizeStoreVertical } from './normalize-store-vertical';

describe('normalizeStoreVertical', () => {
  it('mantém verticais canônicas', () => {
    expect(normalizeStoreVertical('Comércio')).toBe('Comércio');
    expect(normalizeStoreVertical('Clínica')).toBe('Clínica');
  });

  it('mapeia Food e Varejo para Comércio', () => {
    expect(normalizeStoreVertical('Food')).toBe('Comércio');
    expect(normalizeStoreVertical('Varejo')).toBe('Comércio');
  });

  it('preserva valores desconhecidos para o Zod rejeitar', () => {
    expect(normalizeStoreVertical('Imóveis')).toBe('Imóveis');
  });
});

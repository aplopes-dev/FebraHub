import { toErpVerticalSlug } from './store-vertical.catalog';

describe('store-vertical.catalog', () => {
  // As asserções sobre `toKeycloakVerticalSlug` / `toKeycloakVerticalRole` saíram
  // com o ADR C-16: as client roles `vertical.{slug}.view` do `citybox-backoffice`
  // não existem mais, e com um realm por sistema estar no realm já é o gate.
  it('mapeia vertical admin para slug do ERP', () => {
    expect(toErpVerticalSlug('Comércio')).toBe('comercio');
    expect(toErpVerticalSlug('Clínica')).toBe('clinic');
  });

  it('normaliza vertical fora do catálogo em vez de quebrar', () => {
    expect(toErpVerticalSlug(' Comércio ')).toBe('comércio');
    expect(toErpVerticalSlug('Imóveis')).toBe('imoveis');
    expect(toErpVerticalSlug('Beautiful')).toBe('beautiful');
  });
});

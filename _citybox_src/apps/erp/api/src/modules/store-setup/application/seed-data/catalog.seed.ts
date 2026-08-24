import type {
  SeedProductCategory,
  SeedStock,
  SeedUnitOfMeasure,
} from './seed-template.types';

/** Unidades de medida de partida. O lojista acrescenta as suas; estas nunca somem. */
export const SEED_UNITS_OF_MEASURE: readonly SeedUnitOfMeasure[] = [
  {
    systemKey: 'un',
    name: 'Unidade',
    abbreviation: 'un',
    kind: 'unit',
    decimalPlaces: 0,
  },
  {
    systemKey: 'kg',
    name: 'Quilograma',
    abbreviation: 'kg',
    kind: 'weight',
    decimalPlaces: 3,
  },
  {
    systemKey: 'g',
    name: 'Grama',
    abbreviation: 'g',
    kind: 'weight',
    decimalPlaces: 0,
  },
  {
    systemKey: 'l',
    name: 'Litro',
    abbreviation: 'L',
    kind: 'volume',
    decimalPlaces: 3,
  },
  {
    systemKey: 'ml',
    name: 'Mililitro',
    abbreviation: 'ml',
    kind: 'volume',
    decimalPlaces: 0,
  },
  {
    systemKey: 'cx',
    name: 'Caixa',
    abbreviation: 'cx',
    kind: 'unit',
    decimalPlaces: 0,
  },
  {
    systemKey: 'pct',
    name: 'Pacote',
    abbreviation: 'pct',
    kind: 'unit',
    decimalPlaces: 0,
  },
] as const;

/**
 * `Product.categoryId` é obrigatório: sem nenhuma categoria não há como cadastrar o primeiro
 * produto. "Geral" existe para destravar esse começo — o lojista cria as suas depois.
 */
export const SEED_PRODUCT_CATEGORIES: readonly SeedProductCategory[] = [
  { systemKey: 'geral', name: 'Geral' },
] as const;

/** Depósito âncora do módulo de estoque: toda movimentação precisa de um `stockId`. */
export const SEED_STOCKS: readonly SeedStock[] = [
  {
    systemKey: 'principal',
    name: 'Estoque Loja',
    location: 'proprio',
    property: 'proprio',
    isDefault: true,
  },
] as const;

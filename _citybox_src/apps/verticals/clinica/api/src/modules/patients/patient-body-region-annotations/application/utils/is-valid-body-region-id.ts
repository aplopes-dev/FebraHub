/** IDs oficiais do mapa anatômico (espelho de `apps/verticals/clinica/web/src/lib/body-regions.ts`). */
export const BODY_REGION_IDS = [
  'pescoco-anterior',
  'atm-direita',
  'atm-esquerda',
  'ombro-direito',
  'ombro-esquerdo',
  'cotovelo-direito',
  'cotovelo-esquerdo',
  'punho-mao-direito',
  'punho-mao-esquerdo',
  'torax',
  'abdomen',
  'quadril-direito',
  'quadril-esquerdo',
  'coxa-anterior-direita',
  'coxa-anterior-esquerda',
  'joelho-direito',
  'joelho-esquerdo',
  'tornozelo-pe-direito',
  'tornozelo-pe-esquerdo',
  'coluna-cervical',
  'coluna-toracica',
  'coluna-lombar',
  'escapula-direita',
  'escapula-esquerda',
  'gluteo-direito',
  'gluteo-esquerdo',
  'posterior-coxa-direita',
  'posterior-coxa-esquerda',
  'panturrilha-direita',
  'panturrilha-esquerda',
] as const;

export type BodyRegionId = (typeof BODY_REGION_IDS)[number];

const BODY_REGION_ID_SET = new Set<string>(BODY_REGION_IDS);

export function isValidBodyRegionId(value: string): boolean {
  return BODY_REGION_ID_SET.has(value);
}

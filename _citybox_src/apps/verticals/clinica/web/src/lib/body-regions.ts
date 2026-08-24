/** Regiões corporais oficiais — geometria SVG orgânica em `corpogram/corpogram-data.ts`. */
export type BodyRegion = {
  id: string;
  label: string;
  view: 'front' | 'back';
};

export const BODY_REGIONS: readonly BodyRegion[] = [
  { id: 'pescoco-anterior', label: 'Pescoço Anterior', view: 'front' },
  { id: 'atm-direita', label: 'ATM Direita', view: 'front' },
  { id: 'atm-esquerda', label: 'ATM Esquerda', view: 'front' },
  { id: 'ombro-direito', label: 'Ombro Direito', view: 'front' },
  { id: 'ombro-esquerdo', label: 'Ombro Esquerdo', view: 'front' },
  { id: 'cotovelo-direito', label: 'Cotovelo Direito', view: 'front' },
  { id: 'cotovelo-esquerdo', label: 'Cotovelo Esquerdo', view: 'front' },
  { id: 'punho-mao-direito', label: 'Punho / Mão Direito', view: 'front' },
  { id: 'punho-mao-esquerdo', label: 'Punho / Mão Esquerdo', view: 'front' },
  { id: 'torax', label: 'Tórax', view: 'front' },
  { id: 'abdomen', label: 'Abdômen', view: 'front' },
  { id: 'quadril-direito', label: 'Quadril Direito', view: 'front' },
  { id: 'quadril-esquerdo', label: 'Quadril Esquerdo', view: 'front' },
  { id: 'coxa-anterior-direita', label: 'Coxa Anterior Direita', view: 'front' },
  { id: 'coxa-anterior-esquerda', label: 'Coxa Anterior Esquerda', view: 'front' },
  { id: 'joelho-direito', label: 'Joelho Direito', view: 'front' },
  { id: 'joelho-esquerdo', label: 'Joelho Esquerdo', view: 'front' },
  { id: 'tornozelo-pe-direito', label: 'Tornozelo / Pé Direito', view: 'front' },
  { id: 'tornozelo-pe-esquerdo', label: 'Tornozelo / Pé Esquerdo', view: 'front' },
  { id: 'coluna-cervical', label: 'Coluna Cervical', view: 'back' },
  { id: 'coluna-toracica', label: 'Coluna Torácica', view: 'back' },
  { id: 'coluna-lombar', label: 'Coluna Lombar', view: 'back' },
  { id: 'escapula-direita', label: 'Escápula Direita', view: 'back' },
  { id: 'escapula-esquerda', label: 'Escápula Esquerda', view: 'back' },
  { id: 'gluteo-direito', label: 'Glúteo Direito', view: 'back' },
  { id: 'gluteo-esquerdo', label: 'Glúteo Esquerdo', view: 'back' },
  { id: 'posterior-coxa-direita', label: 'Posterior Coxa Direita', view: 'back' },
  { id: 'posterior-coxa-esquerda', label: 'Posterior Coxa Esquerda', view: 'back' },
  { id: 'panturrilha-direita', label: 'Panturrilha Direita', view: 'back' },
  { id: 'panturrilha-esquerda', label: 'Panturrilha Esquerda', view: 'back' },
] as const;

export const BODY_REGION_LABEL_BY_ID = Object.fromEntries(
  BODY_REGIONS.map((region) => [region.id, region.label]),
) as Record<string, string>;

export function bodyRegionLabel(regionId: string): string {
  return BODY_REGION_LABEL_BY_ID[regionId] ?? regionId;
}

import type {
  DocumentTemplate,
  DocumentTemplateType,
  GenerateSurface,
} from '../types';

const SURFACE_TYPES: Record<GenerateSurface, readonly DocumentTemplateType[]> = {
  lead: [
    'contrato-promessa-compra-venda',
    'contrato-locacao',
    'outro',
  ],
  appointment: ['termo-visita'],
  'transaction-sale': ['recibo-sinal', 'proposta-compra'],
  'transaction-rental': ['recibo-sinal', 'proposta-locacao'],
};

export function templateTypesForSurface(
  surface: GenerateSurface,
): readonly DocumentTemplateType[] {
  return SURFACE_TYPES[surface];
}

export function filterTemplatesBySurface(
  templates: readonly DocumentTemplate[],
  surface: GenerateSurface,
): DocumentTemplate[] {
  const allowed = new Set(SURFACE_TYPES[surface]);
  return templates.filter((t) => t.ativo && allowed.has(t.tipo));
}

/**
 * Traduz erros da imoveis-api em texto de formulário para o usuário —
 * aponta os campos com problema e nunca expõe código/status técnico.
 */
import { ImoveisApiError } from '@/lib/imoveis-api';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome do imóvel',
  city: 'Cidade',
  state: 'Estado',
  type: 'Tipo',
  units: 'Unidades',
  cost: 'Valor',
  status: 'Situação',
  occupiedUnits: 'Unidades ocupadas',
  listingType: 'Finalidade',
  negotiable: 'Aceita negociação',
  bedrooms: 'Quartos',
  floors: 'Andares',
  sizeSqm: 'Área (m²)',
  yearBuilt: 'Ano de construção',
  address: 'Endereço',
  country: 'País',
  zipCode: 'CEP',
  mapCoordinate: 'Coordenadas do mapa',
  typeCode: 'Código do tipo',
  description: 'Descrição do imóvel',
  highlights: 'Diferenciais',
  documents: 'Documentos',
};

const GENERIC_REASON = 'Tente novamente em alguns instantes.';
const INVALID_FORM_REASON = 'Revise os dados do formulário e tente novamente.';

/** Motivo em português para exibir na descrição do toast. */
export function describePropertyApiError(error: unknown): string {
  if (!(error instanceof ImoveisApiError)) return GENERIC_REASON;

  if (error.status === 401 || error.status === 403) {
    return 'Você não tem permissão para essa ação.';
  }
  if (error.status === 413) {
    return 'Arquivo muito grande. Use uma imagem menor (máx. 4 MB).';
  }
  if (error.status !== 400 && error.status !== 422) return GENERIC_REASON;

  const labels = fieldLabelsFromDetails(error.details);
  if (labels.length === 0) return INVALID_FORM_REASON;
  const prefix = labels.length === 1 ? 'Revise o campo' : 'Revise os campos';
  return `${prefix}: ${labels.join(', ')}.`;
}

/**
 * As mensagens do class-validator começam pelo caminho do campo
 * (ex.: `name must be longer...`, `documents.0.name must be a string`).
 */
function fieldLabelsFromDetails(details: readonly string[]): string[] {
  const labels: string[] = [];
  for (const detail of details) {
    const field = detail.trim().split(/\s+/)[0]?.split('.')[0] ?? '';
    const label = FIELD_LABELS[field];
    if (label && !labels.includes(label)) labels.push(label);
  }
  return labels;
}

export type ApiDocumentTemplateType =
  | 'termo-visita'
  | 'recibo-sinal'
  | 'proposta-compra'
  | 'proposta-locacao'
  | 'contrato-promessa-compra-venda'
  | 'contrato-locacao'
  | 'outro';

export type PrismaDocumentTemplateType =
  | 'termo_visita'
  | 'recibo_sinal'
  | 'proposta_compra'
  | 'proposta_locacao'
  | 'contrato_promessa_compra_venda'
  | 'contrato_locacao'
  | 'outro';

export type ApiGeneratedDocumentStatus = 'rascunho' | 'gerado';
export type PrismaGeneratedDocumentStatus = ApiGeneratedDocumentStatus;

const TYPE_TO_PRISMA: Record<ApiDocumentTemplateType, PrismaDocumentTemplateType> =
  {
    'termo-visita': 'termo_visita',
    'recibo-sinal': 'recibo_sinal',
    'proposta-compra': 'proposta_compra',
    'proposta-locacao': 'proposta_locacao',
    'contrato-promessa-compra-venda': 'contrato_promessa_compra_venda',
    'contrato-locacao': 'contrato_locacao',
    outro: 'outro',
  };

const TYPE_TO_API: Record<PrismaDocumentTemplateType, ApiDocumentTemplateType> =
  {
    termo_visita: 'termo-visita',
    recibo_sinal: 'recibo-sinal',
    proposta_compra: 'proposta-compra',
    proposta_locacao: 'proposta-locacao',
    contrato_promessa_compra_venda: 'contrato-promessa-compra-venda',
    contrato_locacao: 'contrato-locacao',
    outro: 'outro',
  };

export const DOCUMENT_TEMPLATE_TYPE_LABEL: Record<
  ApiDocumentTemplateType,
  string
> = {
  'termo-visita': 'Termo de visita',
  'recibo-sinal': 'Recibo de sinal',
  'proposta-compra': 'Proposta de compra',
  'proposta-locacao': 'Proposta de locação',
  'contrato-promessa-compra-venda': 'Contrato de promessa de compra e venda',
  'contrato-locacao': 'Contrato de locação',
  outro: 'Outro',
};

export const DOCUMENT_TEMPLATE_TYPES = Object.keys(
  TYPE_TO_PRISMA,
) as ApiDocumentTemplateType[];

export function templateTypeToPrisma(
  value: string,
): PrismaDocumentTemplateType {
  const mapped = TYPE_TO_PRISMA[value as ApiDocumentTemplateType];
  if (!mapped) throw new Error(`Invalid document template type: ${value}`);
  return mapped;
}

export function templateTypeToApi(value: string): ApiDocumentTemplateType {
  const mapped = TYPE_TO_API[value as PrismaDocumentTemplateType];
  if (!mapped) throw new Error(`Invalid prisma document template type: ${value}`);
  return mapped;
}

export function isApiDocumentTemplateType(
  value: string,
): value is ApiDocumentTemplateType {
  return value in TYPE_TO_PRISMA;
}

export function generatedStatusToApi(
  value: string,
): ApiGeneratedDocumentStatus {
  if (value === 'rascunho' || value === 'gerado') return value;
  throw new Error(`Invalid generated document status: ${value}`);
}

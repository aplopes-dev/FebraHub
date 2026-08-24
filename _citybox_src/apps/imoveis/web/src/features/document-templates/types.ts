export const DOCUMENT_TEMPLATE_TYPES = [
  'termo-visita',
  'recibo-sinal',
  'proposta-compra',
  'proposta-locacao',
  'contrato-promessa-compra-venda',
  'contrato-locacao',
  'outro',
] as const;

export type DocumentTemplateType = (typeof DOCUMENT_TEMPLATE_TYPES)[number];

export const DOCUMENT_TEMPLATE_TYPE_LABEL: Record<DocumentTemplateType, string> =
  {
    'termo-visita': 'Termo de visita',
    'recibo-sinal': 'Recibo de sinal',
    'proposta-compra': 'Proposta de compra',
    'proposta-locacao': 'Proposta de locação',
    'contrato-promessa-compra-venda': 'Contrato de promessa de compra e venda',
    'contrato-locacao': 'Contrato de locação',
    outro: 'Outro',
  };

export type DocumentTemplate = {
  id: string;
  nome: string;
  tipo: DocumentTemplateType;
  tipoLabel: string;
  conteudoHtml: string;
  ativo: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVariable = {
  key: string;
  label: string;
  group: string;
  example: string;
};

export type DocumentVariablesCatalog = {
  groups: Record<string, string>;
  variables: readonly DocumentVariable[];
};

export type DocumentTemplateWrite = {
  nome: string;
  tipo: DocumentTemplateType;
  conteudoHtml: string;
  ativo?: boolean;
  isDefault?: boolean;
};

export type GenerateDocumentContext = {
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
};

export type GeneratedDocumentResult = {
  id: string;
  templateId: string;
  titulo: string;
  status: string;
  mimeType: string;
  leadId: string | null;
  leadDocumentId: string | null;
  path: string;
  createdAt: string;
};

export type GenerateSurface = 'lead' | 'appointment' | 'transaction-sale' | 'transaction-rental';

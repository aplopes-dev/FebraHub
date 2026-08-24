import type { Lead, Person, PropertyType } from '@/features/shared/types';

export type LeadStatus =
  | 'new'
  | 'negotiating'
  | 'scheduled-visit'
  | 'closed-won'
  | 'cancelled';

export type LeadSource =
  | 'walk-in'
  | 'website'
  | 'referral'
  | 'social'
  | 'ads'
  | 'whatsapp';

export type LeadPurpose = 'buying' | 'renting' | 'selling';

export const LEAD_PAYMENT_INTENTS = [
  'cash',
  'financing',
  'fgts',
  'trade-in',
] as const;

export type LeadPaymentIntent = (typeof LEAD_PAYMENT_INTENTS)[number];

export type MatchedProperty = {
  id: string;
  name: string;
  /** Capa do imóvel — preenchida pela API na leitura do lead. */
  coverPhotoUrl?: string;
};

export type LeadDocumentKind = 'contract' | 'other';

export type LeadDocument = {
  id: string;
  name: string;
  sizeLabel: string;
  /** `contract` avança o funil; `other` é anexo geral da negociação. */
  kind?: LeadDocumentKind;
  /** ISO date YYYY-MM-DD. */
  addedAt: string;
  /** Object/data URL da sessão de upload — não persiste na API. */
  fileUrl?: string;
  /** Path autenticado quando o arquivo está no MinIO. */
  path?: string;
  mimeType?: string;
  /** ISO datetime — preenchido após envio (WhatsApp). */
  sentAt?: string;
  sentChannel?: 'whatsapp' | 'share' | 'link';
  /** ISO datetime — cliente abriu a página `/d/:token`. */
  viewedAt?: string;
};

export type LeadActivityType =
  | 'note'
  | 'system'
  | 'status'
  | 'assignment'
  | 'document'
  | 'property';

export type LeadActivity = {
  id: string;
  type: LeadActivityType;
  message: string;
  /** ISO datetime. */
  createdAt: string;
  authorName?: string;
};

export type ContactLeadDetail = Lead & {
  status: LeadStatus;
  /** Ex.: "Casa — Comprar" */
  intent: string;
  /** Orçamento já formatado para o card. */
  budgetLabel: string;
  /** ISO date (YYYY-MM-DD) do último contato. */
  lastContactedAt: string;
  propertyName?: string;
  hasSuggestion?: boolean;
  /** Data URL ou URL da foto de perfil (mock: localStorage). */
  photoUrl?: string;
  leadSource: LeadSource;
  interestedPropertyType: PropertyType;
  /** Texto livre da faixa de orçamento no formulário. */
  budgetRange: string;
  preferredLocation: string;
  purpose: LeadPurpose;
  /** Intenção de pagamento (opcional; pode combinar FGTS + financiamento). */
  paymentIntents?: readonly LeadPaymentIntent[];
  /** ISO date — follow-up mais recente (somente leitura no form). */
  latestFollowUp: string;
  /** ISO date — próximo follow-up. */
  nextFollowUp: string;
  notes: string;
  /** Corretores designados (ids de `GET /v1/settings/users`). */
  agentIds: readonly string[];
  matchedProperties: readonly MatchedProperty[];
  documents: readonly LeadDocument[];
  activities: readonly LeadActivity[];
  /** Corretor responsável — filtra Meu perfil; omitido nas listagens gerais = todos. */
  agentId?: string;
  /** ISO datetime — cadastro (export CSV). */
  createdAt?: string;
  updatedAt?: string;
  /** Negócio CRM ativo — etapa do funil de fechamento. */
  activeDeal?: ActiveDeal;
};

export type DealStage =
  | 'awaiting_property'
  | 'property_selected'
  | 'contract_sent'
  | 'contract_signed'
  | 'payment_confirmed'
  | 'handover';

export type DealStatus = 'active' | 'won' | 'cancelled';

export type ActiveDeal = {
  id: string;
  stage: DealStage;
  status: DealStatus;
  propertyId?: string;
  propertyName?: string;
  title?: string;
};

export type DealDetail = {
  id: string;
  leadId: string;
  propertyId?: string;
  propertyName?: string;
  leadName?: string;
  type?: 'SALE' | 'RENTAL';
  status: DealStatus;
  stage: DealStage;
  title: string;
  agentId?: string;
  /** Transação financeira vinculada, quando já criada. */
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListDealsParams = {
  search?: string;
  page?: number;
  perPage?: number;
  leadId?: string;
  propertyId?: string;
  agentId?: string;
  status?: readonly DealStatus[];
  stage?: readonly DealStage[];
};

export type ListDealsResult = {
  data: readonly DealDetail[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  awaiting_property: 'Aguardando imóvel',
  property_selected: 'Imóvel selecionado',
  contract_sent: 'Contrato enviado',
  contract_signed: 'Contrato assinado',
  payment_confirmed: 'Pagamento confirmado',
  handover: 'Entrega',
};

export const DEAL_KANBAN_STAGES: readonly DealStage[] = [
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover',
] as const;

export type ReminderKind =
  | 'follow-up'
  | 'visit'
  | 'signing'
  | 'other'
  | 'expiring'
  | 'new-lead'
  | 'document';

export type LeadReminder = {
  kind: ReminderKind;
  title: string;
  description: string;
  /** 0–100, usado no anel de progresso. */
  progress: number;
  people?: readonly Person[];
  totalPeople?: number;
  isHighlighted?: boolean;
  href?: string;
};

export type FeaturedLeadProperty = {
  id: string;
  name: string;
  typeLabel: string;
  /** Até 4 diferenciais do imóvel. */
  highlights: readonly string[];
  recommendedToLeads: number;
};

export type ListLeadsParams = {
  search?: string;
  page?: number;
  perPage?: number;
  /** Vazio / omitido = todos. */
  status?: readonly LeadStatus[];
  leadSource?: readonly LeadSource[];
  purpose?: readonly LeadPurpose[];
  interestedPropertyType?: readonly PropertyType[];
  /** Quando informado, retorna só leads deste corretor. */
  agentId?: string;
  /** `YYYY-MM-DD` — só leads com retorno devido até esta data (inclusive). */
  followUpUntil?: string;
};

export type ListLeadsResult = {
  data: readonly ContactLeadDetail[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type LeadsSidebar = {
  featuredProperty: FeaturedLeadProperty;
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novo lead',
  negotiating: 'Em negociação',
  'scheduled-visit': 'Visita agendada',
  'closed-won': 'Fechado',
  cancelled: 'Cancelado',
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABEL) as LeadStatus[];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  'walk-in': 'Presencial',
  website: 'Site',
  referral: 'Indicação',
  social: 'Redes sociais',
  ads: 'Anúncios',
  whatsapp: 'WhatsApp',
};

export const LEAD_PURPOSE_LABEL: Record<LeadPurpose, string> = {
  buying: 'Comprar',
  renting: 'Alugar',
  selling: 'Vender',
};

export const LEAD_PAYMENT_INTENT_LABEL: Record<LeadPaymentIntent, string> = {
  cash: 'À vista',
  financing: 'Financiamento bancário',
  fgts: 'FGTS',
  'trade-in': 'Permuta / dação de imóvel',
};

export const LEAD_ACTIVITY_TYPE_LABEL: Record<LeadActivityType, string> = {
  note: 'Nota',
  system: 'Sistema',
  status: 'Status',
  assignment: 'Atribuição',
  document: 'Documento',
  property: 'Imóvel',
};

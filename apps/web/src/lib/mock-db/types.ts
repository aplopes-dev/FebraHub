/**
 * Contratos do banco de demonstração do Comercial.
 *
 * Estes tipos são o vocabulário do negócio da unidade — pessoa com papéis,
 * edição datada, oportunidade, proposta, venda e participante de sala. As
 * features importam daqui em vez de redeclarar; o que é específico de tela
 * (filtros, parâmetros de listagem) fica na própria feature.
 */

/* ─────────────────────────────── Pessoas ─────────────────────────────── */

/**
 * Papéis acumulam, não se substituem: quem virou aluno continua sendo
 * participante dos eventos que fez, e pode ser indicador ao mesmo tempo. É o
 * que permite a mesma ficha atender lead, aluno e comprador.
 */
export type PersonRole =
  | "lead"
  | "participante"
  | "aluno"
  | "ex_aluno"
  | "indicador";

export type OriginChannel =
  | "meta"
  | "google"
  | "instagram"
  | "whatsapp"
  | "sympla"
  | "indicacao"
  | "evento"
  | "palestra"
  | "manual";

export type Origin = {
  channel: OriginChannel;
  campaign?: string;
  /** Edição que originou o contato — o elo entre evento e curso. */
  editionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  state: string;
  roles: PersonRole[];
  origin: Origin;
  ownerId?: string;
  /** Quem indicou esta pessoa (outra `Person`). */
  referredById?: string;
  createdAt: string;
  company?: string;
};

/* ─────────────────────────────── Catálogo ────────────────────────────── */

export type ProductKind =
  | "evento"
  | "imersao"
  | "formacao"
  | "mentoria"
  | "pacote";

export type Product = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  kind: ProductKind;
  listPriceCents: number;
  /** Alçada do consultor: desconto acima disso vai para aprovação. */
  maxDiscountPercent: number;
  active: boolean;
};

export type ConsultantRole = "consultor" | "relacionadora" | "gestor";

export type Consultant = {
  id: string;
  name: string;
  initials: string;
  role: ConsultantRole;
  active: boolean;
};

/* ─────────────────────────────── Edições ─────────────────────────────── */

export type TicketTierName = "Bronze" | "Black" | "Diamond" | "Inteira";

export type TicketTier = {
  id: string;
  name: TicketTierName;
  priceCents: number;
  capacity: number;
  sold: number;
};

export type EditionStatus =
  | "planejada"
  | "vendas_abertas"
  | "em_andamento"
  | "encerrada";

/**
 * Uma edição é o produto **datado** — é ela que fatura, não o produto.
 * Duas edições do mesmo treinamento não são comparáveis se mudam instrutor,
 * praça ou lote.
 */
export type Edition = {
  id: string;
  productId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  city: string;
  venue: string;
  instructor: string;
  capacity: number;
  status: EditionStatus;
  tiers: TicketTier[];
};

/* ─────────────────────────────── Pipeline ────────────────────────────── */

export type StageKind = "aberta" | "ganha" | "perdida";

export type Stage = {
  id: string;
  funnelId: string;
  name: string;
  kind: StageKind;
  probability: number;
  order: number;
  /** Etapa que não aceita entrada sem justificativa (perda). */
  requiresReason: boolean;
};

export type Funnel = {
  id: string;
  name: string;
  description: string;
};

export type LostReason = {
  id: string;
  name: string;
};

export type PaymentMethod =
  | "pix"
  | "cartao_credito"
  | "boleto"
  | "dinheiro"
  | "transferencia";

export type ApprovalStatus =
  | "rascunho"
  | "aguardando_aprovacao"
  | "aprovada"
  | "recusada";

/**
 * Condições da negociação. Preço de tabela e valor praticado são **dois
 * campos**: o desconto some do relatório no dia em que virar um preço só.
 */
export type Proposal = {
  listPriceCents: number;
  discountCents: number;
  netCents: number;
  downPaymentCents: number;
  installments: number;
  paymentMethod: PaymentMethod;
  approvalStatus: ApprovalStatus;
  approvedById?: string;
  approvedAt?: string;
  note?: string;
  updatedAt: string;
};

export type OpportunityStatus = "aberta" | "ganha" | "perdida";

export type Opportunity = {
  id: string;
  personId: string;
  productId: string;
  /** Turma/edição pretendida. `undefined` = a definir. */
  editionId?: string;
  funnelId: string;
  stageId: string;
  ownerId: string;
  amountCents: number;
  status: OpportunityStatus;
  /** Origem imutável — nunca é reescrita quando a oportunidade avança. */
  origin: Origin;
  createdAt: string;
  stageChangedAt: string;
  expectedCloseAt?: string;
  closedAt?: string;
  lostReasonId?: string;
  lostReasonNote?: string;
  proposal?: Proposal;
  saleId?: string;
};

export type TimelineType =
  | "criada"
  | "etapa"
  | "nota"
  | "ligacao"
  | "whatsapp"
  | "email"
  | "reuniao"
  | "proposta"
  | "acao_criada"
  | "acao_concluida"
  | "ganha"
  | "perdida"
  | "sistema";

export type TimelineEntry = {
  id: string;
  opportunityId: string;
  type: TimelineType;
  title: string;
  description?: string;
  authorId?: string;
  createdAt: string;
};

export type NextActionType =
  | "ligar"
  | "whatsapp"
  | "email"
  | "reuniao"
  | "proposta"
  | "follow_up";

export type NextAction = {
  id: string;
  opportunityId: string;
  personId: string;
  ownerId: string;
  type: NextActionType;
  title: string;
  dueAt: string;
  priority: "alta" | "media" | "baixa";
  doneAt?: string;
  result?: string;
};

/* ──────────────────────────────── Vendas ─────────────────────────────── */

export type CommercialStatus =
  | "aguardando_aprovacao"
  | "aprovada"
  | "cancelada";

/** Quem manda neste campo é o Financeiro — o Comercial só lê. */
export type FinancialStatus =
  | "pendente"
  | "parcial"
  | "quitado"
  | "inadimplente"
  | "estornado";

export type SaleInstallment = {
  number: number;
  dueAt: string;
  amountCents: number;
  status: "aberta" | "paga" | "vencida" | "estornada";
  paidAt?: string;
};

export type Sale = {
  id: string;
  number: string;
  opportunityId?: string;
  /** Quem paga. */
  buyerId: string;
  /** Quem cursa — pode ser outra pessoa (empresa que compra para o time). */
  beneficiaryId?: string;
  productId: string;
  editionId?: string;
  sellerId: string;
  /** Relacionadora / quem indicou dentro da casa. */
  referrerId?: string;
  listPriceCents: number;
  discountCents: number;
  netCents: number;
  downPaymentCents: number;
  installments: number;
  paymentMethod: PaymentMethod;
  commercialStatus: CommercialStatus;
  financialStatus: FinancialStatus;
  origin: Origin;
  createdAt: string;
  approvedAt?: string;
  approvedById?: string;
  canceledAt?: string;
  cancelReason?: string;
  installmentsPlan: SaleInstallment[];
};

/* ───────────────────────── Sala (operação de evento) ─────────────────── */

export type AttendeeStatus =
  | "esperado"
  | "presente"
  | "abordado"
  | "matriculado"
  | "pensando"
  | "recusou"
  | "no_show";

/**
 * O participante da sala. A escada inteira do dia acontece nestas transições:
 * esperado → presente (check-in) → abordado → matriculado.
 */
export type Attendee = {
  id: string;
  editionId: string;
  personId: string;
  tierId: string;
  status: AttendeeStatus;
  checkedInAt?: string;
  consultantId?: string;
  approachedAt?: string;
  outcomeNote?: string;
  saleId?: string;
};

/* ──────────────────────────────── Leads ──────────────────────────────── */

export type LeadStatus = "novo" | "em_contato" | "convertido" | "descartado";

export type Lead = {
  id: string;
  personId: string;
  origin: Origin;
  receivedAt: string;
  firstContactAt?: string;
  ownerId?: string;
  status: LeadStatus;
  opportunityId?: string;
  discardReason?: string;
  /** Produto de interesse declarado na captação. */
  interestProductId?: string;
};

import type {
  ApprovalStatus,
  Attendee,
  Edition,
  Funnel,
  NextAction,
  Opportunity,
  OpportunityStatus,
  Origin,
  OriginChannel,
  Person,
  Product,
  Proposal,
  Sale,
  Stage,
  TimelineEntry,
} from "@/lib/mock-db";

/** Recortes rápidos do funil — os três buracos que o gestor caça. */
export type PipelineQuickFilter =
  | "todas"
  | "paradas"
  | "sem_acao"
  | "acao_vencida"
  | "aguardando_aprovacao";

export type PipelineFilters = {
  funnelId: string;
  ownerId: string | "todos";
  productId: string | "todos";
  channel: OriginChannel | "todos";
  quick: PipelineQuickFilter;
  search: string;
};

export type PipelineView = "kanban" | "lista";

/** Linha do funil, já resolvida para a tela (sem lookup no componente). */
export type OpportunityRow = {
  id: string;
  personId: string;
  personName: string;
  personCity: string;
  productName: string;
  productShortName: string;
  editionName?: string;
  ownerId: string;
  ownerName: string;
  ownerInitials: string;
  amountCents: number;
  listPriceCents: number;
  discountPercent: number;
  stageId: string;
  stageName: string;
  status: OpportunityStatus;
  origin: Origin;
  createdAt: string;
  daysInStage: number;
  /** `true` quando parou de andar — 14 dias sem mudar de etapa. */
  stalled: boolean;
  nextAction?: {
    id: string;
    title: string;
    dueAt: string;
    overdue: boolean;
  };
  proposalStatus?: ApprovalStatus;
};

export type PipelineColumn = {
  stage: Stage;
  rows: OpportunityRow[];
  totalCents: number;
};

export type PipelineBoard = {
  funnel: Funnel;
  columns: PipelineColumn[];
  /** Todas as linhas do recorte, para a visão em lista. */
  rows: OpportunityRow[];
  summary: {
    openCount: number;
    openTotalCents: number;
    wonCount: number;
    wonTotalCents: number;
    lostCount: number;
    stalledCount: number;
    withoutActionCount: number;
    overdueActionCount: number;
    awaitingApprovalCount: number;
  };
};

/** Tudo que a ficha 360 mostra, resolvido de uma vez. */
export type OpportunityDetail = {
  opportunity: Opportunity;
  person: Person;
  product?: Product;
  edition?: Edition;
  funnel?: Funnel;
  stage?: Stage;
  stages: Stage[];
  ownerName: string;
  timeline: TimelineEntry[];
  actions: NextAction[];
  openAction?: NextAction;
  proposal?: Proposal;
  sale?: Sale;
  /** A escada da pessoa: o que ela já comprou antes desta oportunidade. */
  history: Array<{
    saleId: string;
    number: string;
    productName: string;
    netCents: number;
    createdAt: string;
  }>;
  /** Eventos em que a pessoa esteve — o elo evento → curso. */
  attendance: Array<{
    attendee: Attendee;
    editionName: string;
    startsAt: string;
  }>;
};

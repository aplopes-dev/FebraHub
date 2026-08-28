import type {
  Consultant,
  Funnel,
  LostReason,
  Product,
  Stage,
} from "@/lib/mock-db/types";

/**
 * Cadastros do Comercial — produtos, time, funis e motivos de perda.
 *
 * O catálogo espelha o portfólio real da unidade (`docs/pesquisa-febracis/`):
 * palestra e imersão de entrada em cima, formações no meio, pacotes-certificação
 * no topo da escada. Os preços são de demonstração e servem para dar ordem de
 * grandeza — a Febracis pratica desconto agressivo por lote, e é justamente por
 * isso que `listPriceCents` e o valor praticado nunca são o mesmo número.
 */
export const PRODUCTS: Product[] = [
  {
    id: "prd-pda",
    code: "PDA",
    name: "O Poder da Ação — palestra",
    shortName: "Poder da Ação",
    kind: "evento",
    listPriceCents: 4_700,
    maxDiscountPercent: 100,
    active: true,
  },
  {
    id: "prd-vsri",
    code: "VSRI",
    name: "Viva sua Real Identidade",
    shortName: "VSRI",
    kind: "imersao",
    listPriceCents: 299_700,
    maxDiscountPercent: 20,
    active: true,
  },
  {
    id: "prd-if",
    code: "IF",
    name: "Imersão Inteligência Financeira",
    shortName: "Inteligência Financeira",
    kind: "imersao",
    listPriceCents: 349_700,
    maxDiscountPercent: 20,
    active: true,
  },
  {
    id: "prd-cis",
    code: "MCIS",
    name: "Método CIS",
    shortName: "Método CIS",
    kind: "imersao",
    listPriceCents: 499_700,
    maxDiscountPercent: 25,
    active: true,
  },
  {
    id: "prd-tav",
    code: "TAV",
    name: "Técnicas Avançadas de Vendas",
    shortName: "TAV",
    kind: "formacao",
    listPriceCents: 249_700,
    maxDiscountPercent: 15,
    active: true,
  },
  {
    id: "prd-bhp",
    code: "BHP",
    name: "Business High Performance",
    shortName: "BHP",
    kind: "formacao",
    listPriceCents: 590_000,
    maxDiscountPercent: 15,
    active: true,
  },
  {
    id: "prd-assessment",
    code: "CISA",
    name: "Formação em Gestão de Perfil Comportamental — CIS Assessment",
    shortName: "CIS Assessment",
    kind: "formacao",
    listPriceCents: 450_000,
    maxDiscountPercent: 15,
    active: true,
  },
  {
    id: "prd-fcis",
    code: "FCIS",
    name: "Formação em Coaching Integral Sistêmico",
    shortName: "Formação em Coaching",
    kind: "formacao",
    listPriceCents: 1_290_000,
    maxDiscountPercent: 12,
    active: true,
  },
  {
    id: "prd-green",
    code: "GREEN",
    name: "Green Belt",
    shortName: "Green Belt",
    kind: "pacote",
    listPriceCents: 2_490_000,
    maxDiscountPercent: 10,
    active: true,
  },
  {
    id: "prd-golden",
    code: "GOLD",
    name: "Golden Belt",
    shortName: "Golden Belt",
    kind: "pacote",
    listPriceCents: 3_990_000,
    maxDiscountPercent: 10,
    active: true,
  },
  {
    id: "prd-coaching",
    code: "COACH1",
    name: "Coaching individual",
    shortName: "Coaching individual",
    kind: "mentoria",
    listPriceCents: 600_000,
    maxDiscountPercent: 20,
    active: true,
  },
];

export const CONSULTANTS: Consultant[] = [
  { id: "usr-dulce", name: "Dulce Mariano", initials: "DM", role: "gestor", active: true },
  { id: "usr-tati", name: "Tatiane Ribeiro", initials: "TR", role: "consultor", active: true },
  { id: "usr-marcos", name: "Marcos Andrade", initials: "MA", role: "consultor", active: true },
  { id: "usr-juliana", name: "Juliana Carvalho", initials: "JC", role: "consultor", active: true },
  { id: "usr-rafael", name: "Rafael Nogueira", initials: "RN", role: "consultor", active: true },
  { id: "usr-bia", name: "Beatriz Sampaio", initials: "BS", role: "relacionadora", active: true },
  { id: "usr-lucas", name: "Lucas Ferreira", initials: "LF", role: "relacionadora", active: true },
];

export const FUNNELS: Funnel[] = [
  {
    id: "fun-cursos",
    name: "Cursos e formações",
    description: "Da captação à matrícula em treinamento.",
  },
  {
    id: "fun-corporativo",
    name: "Corporativo (in company)",
    description: "Empresas que contratam turma fechada ou consultoria.",
  },
];

/**
 * As etapas do funil de cursos seguem a escada real: o contato nasce, é
 * qualificado, participa de um evento (a etapa que mais explica conversão) e só
 * então recebe proposta.
 */
export const STAGES: Stage[] = [
  { id: "stg-novo", funnelId: "fun-cursos", name: "Novo contato", kind: "aberta", probability: 5, order: 1, requiresReason: false },
  { id: "stg-qualificado", funnelId: "fun-cursos", name: "Qualificado", kind: "aberta", probability: 15, order: 2, requiresReason: false },
  { id: "stg-evento", funnelId: "fun-cursos", name: "Convidado ao evento", kind: "aberta", probability: 30, order: 3, requiresReason: false },
  { id: "stg-proposta", funnelId: "fun-cursos", name: "Proposta enviada", kind: "aberta", probability: 55, order: 4, requiresReason: false },
  { id: "stg-negociacao", funnelId: "fun-cursos", name: "Negociação", kind: "aberta", probability: 75, order: 5, requiresReason: false },
  { id: "stg-ganha", funnelId: "fun-cursos", name: "Matriculado", kind: "ganha", probability: 100, order: 6, requiresReason: false },
  { id: "stg-perdida", funnelId: "fun-cursos", name: "Perdida", kind: "perdida", probability: 0, order: 7, requiresReason: true },

  { id: "stg-corp-contato", funnelId: "fun-corporativo", name: "Contato", kind: "aberta", probability: 10, order: 1, requiresReason: false },
  { id: "stg-corp-diagnostico", funnelId: "fun-corporativo", name: "Diagnóstico", kind: "aberta", probability: 35, order: 2, requiresReason: false },
  { id: "stg-corp-proposta", funnelId: "fun-corporativo", name: "Proposta", kind: "aberta", probability: 60, order: 3, requiresReason: false },
  { id: "stg-corp-ganha", funnelId: "fun-corporativo", name: "Fechado", kind: "ganha", probability: 100, order: 4, requiresReason: false },
  { id: "stg-corp-perdida", funnelId: "fun-corporativo", name: "Perdida", kind: "perdida", probability: 0, order: 5, requiresReason: true },
];

export const LOST_REASONS: LostReason[] = [
  { id: "lost-preco", name: "Preço acima do que pode pagar" },
  { id: "lost-momento", name: "Sem momento — adiou a decisão" },
  { id: "lost-semresposta", name: "Parou de responder" },
  { id: "lost-concorrente", name: "Escolheu outra formação" },
  { id: "lost-agenda", name: "Conflito de agenda com a turma" },
  { id: "lost-duplicado", name: "Registro duplicado" },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function findConsultant(id: string | undefined): Consultant | undefined {
  if (!id) return undefined;
  return CONSULTANTS.find((consultant) => consultant.id === id);
}

export function findStage(id: string): Stage | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function stagesOfFunnel(funnelId: string): Stage[] {
  return STAGES.filter((stage) => stage.funnelId === funnelId).sort(
    (a, b) => a.order - b.order,
  );
}

export function findLostReason(id: string | undefined): LostReason | undefined {
  if (!id) return undefined;
  return LOST_REASONS.find((reason) => reason.id === id);
}

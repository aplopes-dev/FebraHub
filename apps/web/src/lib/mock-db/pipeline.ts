import { PRODUCTS, findProduct, stagesOfFunnel } from "@/lib/mock-db/catalog";
import { EDITIONS } from "@/lib/mock-db/editions";
import { PEOPLE } from "@/lib/mock-db/people";
import { createRandom, isoFromNow, seqId } from "@/lib/mock-db/lcg";
import type {
  NextAction,
  NextActionType,
  Opportunity,
  Proposal,
  TimelineEntry,
  TimelineType,
} from "@/lib/mock-db/types";

/**
 * O pipeline comercial: oportunidades, linha do tempo e próximas ações.
 *
 * Três coisas que o dado gerado aqui **precisa** ter, porque são elas que a
 * tela do funil existe para mostrar:
 *
 * - oportunidades **paradas** (`stageChangedAt` antigo) — é o que o gestor caça;
 * - oportunidades **sem próxima ação** — o buraco silencioso do funil;
 * - propostas com desconto **acima da alçada**, esperando aprovação.
 */

const OWNERS = ["usr-tati", "usr-marcos", "usr-juliana", "usr-rafael"];

/** Produtos com peso: imersão de entrada gera muito mais oportunidade. */
const PRODUCT_POOL = [
  "prd-if", "prd-if", "prd-if",
  "prd-cis", "prd-cis", "prd-cis", "prd-cis",
  "prd-vsri", "prd-vsri",
  "prd-tav",
  "prd-bhp",
  "prd-fcis", "prd-fcis",
  "prd-assessment",
  "prd-green",
  "prd-golden",
  "prd-coaching",
];

const NOTE_TITLES: Array<{ type: TimelineType; title: string; description: string }> = [
  { type: "ligacao", title: "Ligação atendida", description: "Falamos sobre a agenda da próxima turma e o que ela espera resolver." },
  { type: "whatsapp", title: "WhatsApp respondido", description: "Mandei o vídeo de depoimento e a condição do lote atual." },
  { type: "reuniao", title: "Reunião de diagnóstico", description: "Levantei o momento profissional e o objetivo dos próximos 12 meses." },
  { type: "nota", title: "Contexto do contato", description: "Veio pela indicação de um aluno da turma anterior; já conhece o método." },
  { type: "whatsapp", title: "Sem resposta", description: "Terceira tentativa sem retorno — vou tentar por ligação amanhã." },
  { type: "email", title: "Proposta enviada por e-mail", description: "Enviei o resumo da condição com validade até o fim do lote." },
];

const ACTION_TITLES: Array<{ type: NextActionType; title: string }> = [
  { type: "ligar", title: "Ligar para confirmar presença" },
  { type: "whatsapp", title: "Mandar condição do lote" },
  { type: "reuniao", title: "Agendar reunião de fechamento" },
  { type: "proposta", title: "Refazer proposta com entrada menor" },
  { type: "follow_up", title: "Follow-up pós-evento" },
];

function buildProposal(
  random: ReturnType<typeof createRandom>,
  productId: string,
  aboveLimit: boolean,
): Proposal {
  const product = findProduct(productId) ?? PRODUCTS[0]!;
  const limit = product.maxDiscountPercent;
  const percent = aboveLimit
    ? limit + random.int(3, 12)
    : random.int(0, Math.max(1, limit));
  const listPriceCents = product.listPriceCents;
  const discountCents = Math.round((listPriceCents * percent) / 100);
  const netCents = listPriceCents - discountCents;
  const installments = random.pick([1, 3, 6, 10, 12]);
  const downPaymentCents =
    installments === 1 ? netCents : Math.round(netCents * random.pick([0.1, 0.2, 0.3]));

  return {
    listPriceCents,
    discountCents,
    netCents,
    downPaymentCents,
    installments,
    paymentMethod: random.pick(["pix", "cartao_credito", "boleto"]),
    approvalStatus: aboveLimit ? "aguardando_aprovacao" : "aprovada",
    approvedById: aboveLimit ? undefined : "usr-dulce",
    approvedAt: aboveLimit ? undefined : isoFromNow(-random.int(1, 9)),
    note: aboveLimit
      ? "Cliente pediu a condição do lote anterior; desconto acima da alçada."
      : undefined,
    updatedAt: isoFromNow(-random.int(0, 12)),
  };
}

type Built = {
  opportunities: Opportunity[];
  timeline: TimelineEntry[];
  actions: NextAction[];
};

function build(): Built {
  const random = createRandom(987_654_321);
  const opportunities: Opportunity[] = [];
  const timeline: TimelineEntry[] = [];
  const actions: NextAction[] = [];

  let timelineSeq = 0;
  let actionSeq = 0;

  const pushTimeline = (
    opportunityId: string,
    type: TimelineType,
    title: string,
    createdAt: string,
    description?: string,
    authorId?: string,
  ) => {
    timelineSeq += 1;
    timeline.push({
      id: seqId("tml", timelineSeq),
      opportunityId,
      type,
      title,
      description,
      authorId,
      createdAt,
    });
  };

  // Uma oportunidade a cada duas pessoas, para sobrar gente sem negócio aberto
  // (é assim na vida real, e a tela de Pessoas precisa mostrar isso).
  const candidates = PEOPLE.filter((_, index) => index % 3 !== 2);

  candidates.forEach((person, index) => {
    const productId = random.pick(PRODUCT_POOL);
    const product = findProduct(productId) ?? PRODUCTS[0]!;
    const isCorporate = Boolean(person.company) && random.chance(0.35);
    const funnelId = isCorporate ? "fun-corporativo" : "fun-cursos";
    const stages = stagesOfFunnel(funnelId);
    const openStages = stages.filter((stage) => stage.kind === "aberta");

    // Distribuição: 62% abertas, 22% ganhas, 16% perdidas.
    const roll = random.next();
    const outcome = roll < 0.62 ? "aberta" : roll < 0.84 ? "ganha" : "perdida";

    const stage =
      outcome === "aberta"
        ? random.pick(openStages)
        : stages.find((item) => item.kind === (outcome === "ganha" ? "ganha" : "perdida"))!;

    const createdAt = isoFromNow(-random.int(2, 120), -random.int(1, 20));
    const stalled = outcome === "aberta" && random.chance(0.28);
    const stageChangedAt = isoFromNow(
      stalled ? -random.int(14, 45) : -random.int(0, 9),
      -random.int(1, 12),
    );

    const id = seqId("opp", index + 1);
    const ownerId = person.ownerId ?? random.pick(OWNERS);

    const wantsEdition =
      product.kind === "imersao" || product.kind === "evento" || random.chance(0.3);
    const editionId = wantsEdition
      ? random.pick(EDITIONS.filter((edition) => edition.productId === productId))?.id ??
        (random.chance(0.5) ? undefined : random.pick(EDITIONS).id)
      : undefined;

    const hasProposal =
      stage.id === "stg-proposta" ||
      stage.id === "stg-negociacao" ||
      stage.id === "stg-corp-proposta" ||
      outcome === "ganha";

    const aboveLimit = hasProposal && random.chance(0.22);
    const proposal = hasProposal ? buildProposal(random, productId, aboveLimit) : undefined;

    const opportunity: Opportunity = {
      id,
      personId: person.id,
      productId,
      editionId,
      funnelId,
      stageId: stage.id,
      ownerId,
      amountCents: proposal?.netCents ?? product.listPriceCents,
      status: outcome,
      origin: person.origin,
      createdAt,
      stageChangedAt,
      expectedCloseAt:
        outcome === "aberta" ? isoFromNow(random.int(-6, 40)) : undefined,
      closedAt: outcome === "aberta" ? undefined : stageChangedAt,
      lostReasonId:
        outcome === "perdida"
          ? random.pick([
              "lost-preco",
              "lost-momento",
              "lost-semresposta",
              "lost-concorrente",
              "lost-agenda",
            ])
          : undefined,
      proposal,
    };

    opportunities.push(opportunity);

    /* ── linha do tempo ── */
    pushTimeline(id, "criada", "Oportunidade criada", createdAt, `Origem: ${person.origin.channel}.`, ownerId);

    const interactions = random.int(1, 4);
    for (let i = 0; i < interactions; i += 1) {
      const note = random.pick(NOTE_TITLES);
      pushTimeline(
        id,
        note.type,
        note.title,
        isoFromNow(-random.int(1, 30), -random.int(1, 12)),
        note.description,
        ownerId,
      );
    }

    if (stage.order > 1) {
      pushTimeline(
        id,
        "etapa",
        `Movida para ${stage.name}`,
        stageChangedAt,
        undefined,
        ownerId,
      );
    }

    if (proposal) {
      pushTimeline(
        id,
        "proposta",
        aboveLimit ? "Proposta enviada para aprovação" : "Proposta registrada",
        proposal.updatedAt,
        `Tabela ${(proposal.listPriceCents / 100).toFixed(2)} · praticado ${(proposal.netCents / 100).toFixed(2)}`,
        ownerId,
      );
    }

    if (outcome === "ganha") {
      pushTimeline(id, "ganha", "Matrícula fechada", stageChangedAt, undefined, ownerId);
    }
    if (outcome === "perdida") {
      pushTimeline(id, "perdida", "Oportunidade perdida", stageChangedAt, undefined, ownerId);
    }

    /* ── próxima ação ── */
    // 22% das abertas ficam sem próxima ação de propósito: é o indicador de
    // buraco que a visão geral precisa acusar.
    if (outcome === "aberta" && !random.chance(0.22)) {
      const action = random.pick(ACTION_TITLES);
      const overdue = random.chance(0.35);
      actionSeq += 1;
      actions.push({
        id: seqId("act", actionSeq),
        opportunityId: id,
        personId: person.id,
        ownerId,
        type: action.type,
        title: action.title,
        dueAt: isoFromNow(overdue ? -random.int(1, 12) : random.int(0, 10), random.int(1, 9)),
        priority: random.pick(["alta", "media", "baixa"]),
      });
    }
  });

  return { opportunities, timeline, actions };
}

const built = build();

/** Stores mutáveis — as telas movem card, registram interação e fecham venda. */
export const OPPORTUNITIES: Opportunity[] = built.opportunities;
export const TIMELINE: TimelineEntry[] = built.timeline;
export const NEXT_ACTIONS: NextAction[] = built.actions;

export function findOpportunity(id: string | undefined): Opportunity | undefined {
  if (!id) return undefined;
  return OPPORTUNITIES.find((opportunity) => opportunity.id === id);
}

export function timelineOf(opportunityId: string): TimelineEntry[] {
  return TIMELINE.filter((entry) => entry.opportunityId === opportunityId).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

export function actionsOf(opportunityId: string): NextAction[] {
  return NEXT_ACTIONS.filter((action) => action.opportunityId === opportunityId).sort(
    (a, b) => a.dueAt.localeCompare(b.dueAt),
  );
}

export function openActionOf(opportunityId: string): NextAction | undefined {
  return actionsOf(opportunityId).find((action) => !action.doneAt);
}

export function opportunitiesOfPerson(personId: string): Opportunity[] {
  return OPPORTUNITIES.filter((opportunity) => opportunity.personId === personId).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

let timelineCounter = built.timeline.length;
let actionCounter = built.actions.length;

export function pushTimelineEntry(
  entry: Omit<TimelineEntry, "id">,
): TimelineEntry {
  timelineCounter += 1;
  const created: TimelineEntry = { ...entry, id: seqId("tml", timelineCounter) };
  TIMELINE.push(created);
  return created;
}

export function pushNextAction(action: Omit<NextAction, "id">): NextAction {
  actionCounter += 1;
  const created: NextAction = { ...action, id: seqId("act", actionCounter) };
  NEXT_ACTIONS.push(created);
  return created;
}

export function nextOpportunityId(): string {
  return seqId("opp", OPPORTUNITIES.length + 1);
}

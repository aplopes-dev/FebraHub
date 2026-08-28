import { findProduct, stagesOfFunnel } from "@/lib/mock-db/catalog";
import { isoFromNow, seqId } from "@/lib/mock-db/lcg";
import { LEADS } from "@/lib/mock-db/leads";
import { addPersonRole } from "@/lib/mock-db/people";
import {
  NEXT_ACTIONS,
  OPPORTUNITIES,
  findOpportunity,
  openActionOf,
  pushNextAction,
  pushTimelineEntry,
} from "@/lib/mock-db/pipeline";
import { ATTENDEES, findAttendee } from "@/lib/mock-db/room";
import { SALES, createSaleFromOpportunity } from "@/lib/mock-db/sales";
import type {
  Attendee,
  AttendeeStatus,
  Lead,
  NextAction,
  NextActionType,
  Opportunity,
  PaymentMethod,
  Proposal,
  Sale,
  TimelineType,
} from "@/lib/mock-db/types";

/**
 * Ações que atravessam entidades.
 *
 * Os arquivos de dados guardam cada coisa no seu lugar; é aqui que o efeito
 * colateral acontece de forma consistente — ganhar oportunidade gera venda,
 * matricular na sala mexe no funil, converter lead cria oportunidade. Quando o
 * `apps/api` assumir, este arquivo é o mapa do que cada endpoint precisa fazer
 * numa transação só.
 */

/* ───────────────────────────── Oportunidade ──────────────────────────── */

export type MoveStageInput = {
  opportunityId: string;
  stageId: string;
  userId?: string;
  lostReasonId?: string;
  lostReasonNote?: string;
};

export function moveOpportunityStage(input: MoveStageInput): Opportunity | undefined {
  const opportunity = findOpportunity(input.opportunityId);
  if (!opportunity) return undefined;

  const stages = stagesOfFunnel(opportunity.funnelId);
  const target = stages.find((stage) => stage.id === input.stageId);
  if (!target) return opportunity;

  const previous = stages.find((stage) => stage.id === opportunity.stageId);
  const now = isoFromNow(0);

  opportunity.stageId = target.id;
  opportunity.stageChangedAt = now;
  opportunity.status =
    target.kind === "ganha" ? "ganha" : target.kind === "perdida" ? "perdida" : "aberta";

  if (target.kind === "aberta") {
    opportunity.closedAt = undefined;
    opportunity.lostReasonId = undefined;
    opportunity.lostReasonNote = undefined;
  } else {
    opportunity.closedAt = now;
  }

  if (target.kind === "perdida") {
    opportunity.lostReasonId = input.lostReasonId;
    opportunity.lostReasonNote = input.lostReasonNote;
  }

  pushTimelineEntry({
    opportunityId: opportunity.id,
    type: target.kind === "ganha" ? "ganha" : target.kind === "perdida" ? "perdida" : "etapa",
    title:
      target.kind === "ganha"
        ? "Matrícula fechada"
        : target.kind === "perdida"
          ? "Oportunidade perdida"
          : `Movida de ${previous?.name ?? "—"} para ${target.name}`,
    description: input.lostReasonNote,
    authorId: input.userId,
    createdAt: now,
  });

  if (target.kind === "ganha" && !opportunity.saleId) {
    const sale = createSaleFromOpportunity(opportunity);
    opportunity.saleId = sale.id;
    addPersonRole(opportunity.personId, "aluno");
    pushTimelineEntry({
      opportunityId: opportunity.id,
      type: "sistema",
      title: `Venda ${sale.number} gerada`,
      description: "Aguardando aprovação comercial. O financeiro nasce pendente.",
      createdAt: now,
    });
  }

  return opportunity;
}

export function registerInteraction(input: {
  opportunityId: string;
  type: TimelineType;
  title: string;
  description?: string;
  userId?: string;
}) {
  return pushTimelineEntry({
    opportunityId: input.opportunityId,
    type: input.type,
    title: input.title,
    description: input.description,
    authorId: input.userId,
    createdAt: isoFromNow(0),
  });
}

export type ProposalInput = {
  opportunityId: string;
  discountCents: number;
  downPaymentCents: number;
  installments: number;
  paymentMethod: PaymentMethod;
  note?: string;
};

/**
 * Grava a condição negociada e decide sozinha se precisa de aprovação:
 * desconto dentro da alçada do produto passa direto, acima dela fica
 * `aguardando_aprovacao`. É a regra que impede o desconto de virar preço.
 */
export function saveProposal(input: ProposalInput): Proposal | undefined {
  const opportunity = findOpportunity(input.opportunityId);
  if (!opportunity) return undefined;

  const product = findProduct(opportunity.productId);
  const listPriceCents = product?.listPriceCents ?? opportunity.amountCents;
  const discountCents = Math.min(Math.max(0, input.discountCents), listPriceCents);
  const netCents = listPriceCents - discountCents;
  const percent = listPriceCents > 0 ? (discountCents / listPriceCents) * 100 : 0;
  const aboveLimit = percent > (product?.maxDiscountPercent ?? 0);

  const proposal: Proposal = {
    listPriceCents,
    discountCents,
    netCents,
    downPaymentCents: Math.min(Math.max(0, input.downPaymentCents), netCents),
    installments: Math.max(1, input.installments),
    paymentMethod: input.paymentMethod,
    approvalStatus: aboveLimit ? "aguardando_aprovacao" : "aprovada",
    approvedById: aboveLimit ? undefined : "usr-dulce",
    approvedAt: aboveLimit ? undefined : isoFromNow(0),
    note: input.note,
    updatedAt: isoFromNow(0),
  };

  opportunity.proposal = proposal;
  opportunity.amountCents = netCents;

  pushTimelineEntry({
    opportunityId: opportunity.id,
    type: "proposta",
    title: aboveLimit ? "Proposta enviada para aprovação" : "Proposta registrada",
    description: `Desconto de ${percent.toFixed(1)}% sobre a tabela.`,
    createdAt: proposal.updatedAt,
  });

  return proposal;
}

export function decideProposal(input: {
  opportunityId: string;
  approve: boolean;
  userId?: string;
}): Proposal | undefined {
  const opportunity = findOpportunity(input.opportunityId);
  if (!opportunity?.proposal) return undefined;

  opportunity.proposal.approvalStatus = input.approve ? "aprovada" : "recusada";
  opportunity.proposal.approvedById = input.userId ?? "usr-dulce";
  opportunity.proposal.approvedAt = isoFromNow(0);

  pushTimelineEntry({
    opportunityId: opportunity.id,
    type: "proposta",
    title: input.approve ? "Desconto aprovado" : "Desconto recusado",
    authorId: input.userId,
    createdAt: isoFromNow(0),
  });

  return opportunity.proposal;
}

export function createNextAction(input: {
  opportunityId: string;
  personId: string;
  ownerId: string;
  type: NextActionType;
  title: string;
  dueAt: string;
  priority: NextAction["priority"];
}): NextAction {
  const action = pushNextAction({ ...input });
  pushTimelineEntry({
    opportunityId: input.opportunityId,
    type: "acao_criada",
    title: `Próxima ação: ${input.title}`,
    authorId: input.ownerId,
    createdAt: isoFromNow(0),
  });
  return action;
}

export function completeNextAction(actionId: string, result?: string): NextAction | undefined {
  const action = NEXT_ACTIONS.find((item) => item.id === actionId);
  if (!action) return undefined;

  action.doneAt = isoFromNow(0);
  action.result = result;

  pushTimelineEntry({
    opportunityId: action.opportunityId,
    type: "acao_concluida",
    title: `Ação concluída: ${action.title}`,
    description: result,
    authorId: action.ownerId,
    createdAt: action.doneAt,
  });

  return action;
}

/* ──────────────────────────────── Leads ──────────────────────────────── */

export function assignLead(leadId: string, ownerId: string): Lead | undefined {
  const lead = LEADS.find((item) => item.id === leadId);
  if (!lead) return undefined;
  lead.ownerId = ownerId;
  if (lead.status === "novo") lead.status = "em_contato";
  if (!lead.firstContactAt) lead.firstContactAt = isoFromNow(0);
  return lead;
}

export function discardLead(leadId: string, reason: string): Lead | undefined {
  const lead = LEADS.find((item) => item.id === leadId);
  if (!lead) return undefined;
  lead.status = "descartado";
  lead.discardReason = reason;
  return lead;
}

export type ConvertLeadInput = {
  leadId: string;
  funnelId: string;
  productId: string;
  editionId?: string;
  ownerId: string;
};

/** Lead vira oportunidade **preservando a origem** — ela nunca é reescrita. */
export function convertLead(input: ConvertLeadInput): Opportunity | undefined {
  const lead = LEADS.find((item) => item.id === input.leadId);
  if (!lead) return undefined;

  const stages = stagesOfFunnel(input.funnelId);
  const firstStage = stages.find((stage) => stage.kind === "aberta");
  if (!firstStage) return undefined;

  const product = findProduct(input.productId);
  const now = isoFromNow(0);

  const opportunity: Opportunity = {
    id: seqId("opp", OPPORTUNITIES.length + 1),
    personId: lead.personId,
    productId: input.productId,
    editionId: input.editionId,
    funnelId: input.funnelId,
    stageId: firstStage.id,
    ownerId: input.ownerId,
    amountCents: product?.listPriceCents ?? 0,
    status: "aberta",
    origin: lead.origin,
    createdAt: now,
    stageChangedAt: now,
  };

  OPPORTUNITIES.push(opportunity);

  lead.status = "convertido";
  lead.opportunityId = opportunity.id;
  lead.ownerId = input.ownerId;
  if (!lead.firstContactAt) lead.firstContactAt = now;

  pushTimelineEntry({
    opportunityId: opportunity.id,
    type: "criada",
    title: "Oportunidade criada a partir do lead",
    description: `Origem preservada: ${lead.origin.channel}.`,
    authorId: input.ownerId,
    createdAt: now,
  });

  return opportunity;
}

/* ───────────────────────────────── Sala ──────────────────────────────── */

export function checkInAttendee(attendeeId: string): Attendee | undefined {
  const attendee = findAttendee(attendeeId);
  if (!attendee) return undefined;
  attendee.checkedInAt = isoFromNow(0);
  if (attendee.status === "esperado" || attendee.status === "no_show") {
    attendee.status = "presente";
  }
  return attendee;
}

export function undoCheckIn(attendeeId: string): Attendee | undefined {
  const attendee = findAttendee(attendeeId);
  if (!attendee) return undefined;
  attendee.checkedInAt = undefined;
  attendee.status = "esperado";
  return attendee;
}

export function assignConsultant(
  attendeeId: string,
  consultantId: string,
): Attendee | undefined {
  const attendee = findAttendee(attendeeId);
  if (!attendee) return undefined;
  attendee.consultantId = consultantId;
  return attendee;
}

export type ApproachOutcome = Extract<
  AttendeeStatus,
  "matriculado" | "pensando" | "recusou" | "abordado"
>;

/**
 * Resultado da abordagem na sala. Matricular aqui **fecha o ciclo**: cria a
 * oportunidade já ganha (com a edição como origem), gera a venda e marca o
 * papel de aluno na pessoa — que é como a conversão evento→curso deixa de ser
 * estimativa e vira registro.
 */
export function registerApproach(input: {
  attendeeId: string;
  outcome: ApproachOutcome;
  consultantId: string;
  note?: string;
  productId?: string;
}): { attendee: Attendee; sale?: Sale } | undefined {
  const attendee = findAttendee(input.attendeeId);
  if (!attendee) return undefined;

  const now = isoFromNow(0);
  attendee.status = input.outcome;
  attendee.consultantId = input.consultantId;
  attendee.approachedAt = now;
  attendee.outcomeNote = input.note;
  if (!attendee.checkedInAt) attendee.checkedInAt = now;

  if (input.outcome !== "matriculado") {
    return { attendee };
  }

  const productId = input.productId ?? "prd-cis";
  const product = findProduct(productId);
  const stages = stagesOfFunnel("fun-cursos");
  const wonStage = stages.find((stage) => stage.kind === "ganha");

  const opportunity: Opportunity = {
    id: seqId("opp", OPPORTUNITIES.length + 1),
    personId: attendee.personId,
    productId,
    editionId: undefined,
    funnelId: "fun-cursos",
    stageId: wonStage?.id ?? "stg-ganha",
    ownerId: input.consultantId,
    amountCents: product?.listPriceCents ?? 0,
    status: "ganha",
    // A sala é a origem: é o evento que produziu a matrícula.
    origin: { channel: "evento", editionId: attendee.editionId },
    createdAt: now,
    stageChangedAt: now,
    closedAt: now,
  };

  OPPORTUNITIES.push(opportunity);

  pushTimelineEntry({
    opportunityId: opportunity.id,
    type: "ganha",
    title: "Matrícula fechada na sala",
    description: input.note,
    authorId: input.consultantId,
    createdAt: now,
  });

  const sale = createSaleFromOpportunity(opportunity);
  opportunity.saleId = sale.id;
  attendee.saleId = sale.id;
  addPersonRole(attendee.personId, "aluno");

  return { attendee, sale };
}

/* ──────────────────────────────── Vendas ─────────────────────────────── */

export function approveSale(saleId: string, userId = "usr-dulce"): Sale | undefined {
  const sale = SALES.find((item) => item.id === saleId);
  if (!sale) return undefined;
  sale.commercialStatus = "aprovada";
  sale.approvedAt = isoFromNow(0);
  sale.approvedById = userId;
  return sale;
}

export function cancelSale(saleId: string, reason: string): Sale | undefined {
  const sale = SALES.find((item) => item.id === saleId);
  if (!sale) return undefined;
  sale.commercialStatus = "cancelada";
  sale.canceledAt = isoFromNow(0);
  sale.cancelReason = reason;
  sale.financialStatus = "estornado";
  return sale;
}

/* ───────────────────────────── Diagnóstico ───────────────────────────── */

/** Oportunidades abertas sem próxima ação pendente. */
export function opportunitiesWithoutNextAction(): Opportunity[] {
  return OPPORTUNITIES.filter(
    (opportunity) => opportunity.status === "aberta" && !openActionOf(opportunity.id),
  );
}

export function attendeesPendingApproach(editionId: string): Attendee[] {
  return ATTENDEES.filter(
    (attendee) =>
      attendee.editionId === editionId &&
      Boolean(attendee.checkedInAt) &&
      !attendee.approachedAt,
  );
}

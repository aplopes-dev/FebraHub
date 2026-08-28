import {
  ATTENDEES,
  CONSULTANTS,
  FUNNELS,
  NEXT_ACTIONS,
  OPPORTUNITIES,
  PRODUCTS,
  SALES,
  actionsOf,
  daysSince,
  findConsultant,
  findEdition,
  findLostReason,
  findPerson,
  findProduct,
  findSale,
  findStage,
  isOverdue,
  openActionOf,
  stagesOfFunnel,
  timelineOf,
  type Opportunity,
} from "@/lib/mock-db";
import { discountPercent } from "@/lib/money";
import type {
  OpportunityDetail,
  OpportunityRow,
  PipelineBoard,
  PipelineFilters,
} from "@/features/pipeline/types/pipeline-view";

/**
 * A camada que a tela do funil enxerga.
 *
 * **É o seam com a API.** Hoje lê do `mock-db` em memória; quando o
 * `apps/api` expuser `/comercial/oportunidades`, só as funções deste arquivo
 * trocam de corpo — nenhum componente sabe de onde o dado vem.
 *
 * Toda resolução de nome (pessoa, produto, responsável) acontece aqui: o
 * componente recebe linha pronta e não faz lookup no meio do JSX.
 */

const STALLED_DAYS = 14;

export function toRow(opportunity: Opportunity): OpportunityRow {
  const person = findPerson(opportunity.personId);
  const product = findProduct(opportunity.productId);
  const owner = findConsultant(opportunity.ownerId);
  const stage = findStage(opportunity.stageId);
  const edition = findEdition(opportunity.editionId);
  const action = openActionOf(opportunity.id);
  const listPriceCents = opportunity.proposal?.listPriceCents ?? product?.listPriceCents ?? 0;
  const daysInStage = Math.max(0, daysSince(opportunity.stageChangedAt));

  return {
    id: opportunity.id,
    personId: opportunity.personId,
    personName: person?.name ?? "—",
    personCity: person?.city ?? "—",
    productName: product?.name ?? "—",
    productShortName: product?.shortName ?? "—",
    editionName: edition?.name,
    ownerId: opportunity.ownerId,
    ownerName: owner?.name ?? "Sem dono",
    ownerInitials: owner?.initials ?? "—",
    amountCents: opportunity.amountCents,
    listPriceCents,
    discountPercent: discountPercent(listPriceCents, opportunity.amountCents),
    stageId: opportunity.stageId,
    stageName: stage?.name ?? "—",
    status: opportunity.status,
    origin: opportunity.origin,
    createdAt: opportunity.createdAt,
    daysInStage,
    stalled: opportunity.status === "aberta" && daysInStage >= STALLED_DAYS,
    nextAction: action
      ? {
          id: action.id,
          title: action.title,
          dueAt: action.dueAt,
          overdue: isOverdue(action.dueAt),
        }
      : undefined,
    proposalStatus: opportunity.proposal?.approvalStatus,
  };
}

function matchesSearch(row: OpportunityRow, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    row.personName.toLowerCase().includes(term) ||
    row.productName.toLowerCase().includes(term) ||
    row.ownerName.toLowerCase().includes(term) ||
    (row.editionName?.toLowerCase().includes(term) ?? false)
  );
}

function matchesQuick(row: OpportunityRow, filters: PipelineFilters): boolean {
  switch (filters.quick) {
    case "paradas":
      return row.stalled;
    case "sem_acao":
      return row.status === "aberta" && !row.nextAction;
    case "acao_vencida":
      return Boolean(row.nextAction?.overdue);
    case "aguardando_aprovacao":
      return row.proposalStatus === "aguardando_aprovacao";
    default:
      return true;
  }
}

export function getPipelineBoard(filters: PipelineFilters): PipelineBoard {
  const funnel = FUNNELS.find((item) => item.id === filters.funnelId) ?? FUNNELS[0]!;
  const stages = stagesOfFunnel(funnel.id);

  const rows = OPPORTUNITIES.filter((opportunity) => opportunity.funnelId === funnel.id)
    .map(toRow)
    .filter((row) => {
      if (filters.ownerId !== "todos" && row.ownerId !== filters.ownerId) return false;
      if (filters.productId !== "todos") {
        const opportunity = OPPORTUNITIES.find((item) => item.id === row.id);
        if (opportunity?.productId !== filters.productId) return false;
      }
      if (filters.channel !== "todos" && row.origin.channel !== filters.channel) return false;
      if (!matchesSearch(row, filters.search)) return false;
      return matchesQuick(row, filters);
    })
    .sort((a, b) => b.amountCents - a.amountCents);

  const columns = stages.map((stage) => {
    const stageRows = rows.filter((row) => row.stageId === stage.id);
    return {
      stage,
      rows: stageRows,
      totalCents: stageRows.reduce((total, row) => total + row.amountCents, 0),
    };
  });

  const open = rows.filter((row) => row.status === "aberta");
  const won = rows.filter((row) => row.status === "ganha");

  return {
    funnel,
    columns,
    rows,
    summary: {
      openCount: open.length,
      openTotalCents: open.reduce((total, row) => total + row.amountCents, 0),
      wonCount: won.length,
      wonTotalCents: won.reduce((total, row) => total + row.amountCents, 0),
      lostCount: rows.filter((row) => row.status === "perdida").length,
      stalledCount: open.filter((row) => row.stalled).length,
      withoutActionCount: open.filter((row) => !row.nextAction).length,
      overdueActionCount: open.filter((row) => row.nextAction?.overdue).length,
      awaitingApprovalCount: rows.filter(
        (row) => row.proposalStatus === "aguardando_aprovacao",
      ).length,
    },
  };
}

export function getOpportunityDetail(id: string): OpportunityDetail | undefined {
  const opportunity = OPPORTUNITIES.find((item) => item.id === id);
  if (!opportunity) return undefined;

  const person = findPerson(opportunity.personId);
  if (!person) return undefined;

  const history = SALES.filter(
    (sale) => sale.buyerId === person.id && sale.opportunityId !== opportunity.id,
  )
    .map((sale) => ({
      saleId: sale.id,
      number: sale.number,
      productName: findProduct(sale.productId)?.shortName ?? "—",
      netCents: sale.netCents,
      createdAt: sale.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const attendance = ATTENDEES.filter((attendee) => attendee.personId === person.id)
    .map((attendee) => {
      const edition = findEdition(attendee.editionId);
      return {
        attendee,
        editionName: edition?.name ?? "—",
        startsAt: edition?.startsAt ?? "",
      };
    })
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return {
    opportunity,
    person,
    product: findProduct(opportunity.productId),
    edition: findEdition(opportunity.editionId),
    funnel: FUNNELS.find((item) => item.id === opportunity.funnelId),
    stage: findStage(opportunity.stageId),
    stages: stagesOfFunnel(opportunity.funnelId),
    ownerName: findConsultant(opportunity.ownerId)?.name ?? "Sem dono",
    timeline: timelineOf(opportunity.id),
    actions: actionsOf(opportunity.id),
    openAction: openActionOf(opportunity.id),
    proposal: opportunity.proposal,
    sale: findSale(opportunity.saleId),
    history,
    attendance,
  };
}

export function lostReasonName(id: string | undefined): string | undefined {
  return findLostReason(id)?.name;
}

/** Opções dos filtros — vêm dos mesmos cadastros que alimentam o board. */
export function getPipelineOptions() {
  return {
    funnels: FUNNELS,
    owners: CONSULTANTS.filter((consultant) => consultant.role !== "gestor"),
    products: PRODUCTS.filter((product) => product.active),
  };
}

/** Ações abertas do responsável, para o painel "minha operação". */
export function myOpenActions(ownerId: string) {
  return NEXT_ACTIONS.filter((action) => action.ownerId === ownerId && !action.doneAt)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .map((action) => ({
      ...action,
      overdue: isOverdue(action.dueAt),
      personName: findPerson(action.personId)?.name ?? "—",
    }));
}

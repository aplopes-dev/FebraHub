import {
  ATTENDEES,
  CONSULTANTS,
  EDITIONS,
  LEADS,
  NEXT_ACTIONS,
  OPPORTUNITIES,
  SALES,
  editionSold,
  findEdition,
  findProduct,
  isOverdue,
  mockNow,
  openActionOf,
  roomCounters,
  upcomingEditions,
  type Edition,
} from "@/lib/mock-db";
import { discountPercent } from "@/lib/money";

/**
 * Os números da visão geral do Comercial.
 *
 * Duas regras herdadas do `HUB_EXECUTIVO.md` e do `BRIEFING.md` valem aqui e
 * moldaram o que entra:
 *
 * - **Nada de "receita total".** Ingresso de evento e matrícula de curso são
 *   unidades de negócio diferentes; aparecem separados, nunca somados.
 * - **Mês parcial é mês parcial.** O recorte vai do dia 1 até hoje e o card
 *   diz isso — comparar 27 dias com um mês cheio produz queda que não existe.
 */

const STALLED_DAYS = 14;

function monthStart(): Date {
  const now = mockNow();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function inCurrentMonth(iso: string): boolean {
  const value = new Date(iso).getTime();
  return value >= monthStart().getTime() && value <= mockNow().getTime();
}

export type AttentionItem = {
  id: string;
  label: string;
  count: number;
  hint: string;
  href: string;
  tone: "error" | "warning" | "info";
};

export type ScoreboardRow = {
  consultantId: string;
  name: string;
  initials: string;
  enrollments: number;
  netCents: number;
  openCount: number;
  openCents: number;
  discountPercent: number;
};

/** Um mês da série histórica. `partial` = mês em andamento. */
export type MonthPoint = {
  month: string;
  netCents: number;
  /** Mesmo mês do ano anterior — comparação, nunca meta. */
  previousCents: number;
  enrollments: number;
  partial: boolean;
};

export type CommercialOverview = {
  periodLabel: string;
  kpis: {
    leadsCount: number;
    leadsWithoutOwner: number;
    openCount: number;
    openCents: number;
    enrollmentsCount: number;
    enrollmentsCents: number;
    listCents: number;
    averageDiscountPercent: number;
    averageTicketCents: number | null;
    /** Variação do mês contra o mesmo mês do ano passado. */
    yoyPercent: number | null;
    lostCount: number;
    winRatePercent: number;
  };
  /** 12 meses fechados + o corrente (parcial). */
  series: MonthPoint[];
  attention: AttentionItem[];
  scoreboard: ScoreboardRow[];
  liveEdition?: {
    edition: Edition;
    counters: ReturnType<typeof roomCounters>;
    productName: string;
  };
  nextEditions: Array<{
    edition: Edition;
    productName: string;
    sold: number;
    occupancyPercent: number;
  }>;
};

/**
 * Faturamento e matrículas mês a mês — 12 meses fechados + o corrente.
 *
 * Cada ponto carrega o **mesmo mês do ano anterior** para comparação. Isso é
 * histórico, não meta: pintar uma referência como meta seria inventar cobrança
 * que ninguém combinou.
 */
function buildSeries(): MonthPoint[] {
  const totals = new Map<string, { netCents: number; enrollments: number }>();

  for (const sale of SALES) {
    if (sale.commercialStatus === "cancelada") continue;
    const month = sale.createdAt.slice(0, 7);
    const current = totals.get(month) ?? { netCents: 0, enrollments: 0 };
    current.netCents += sale.netCents;
    current.enrollments += 1;
    totals.set(month, current);
  }

  const now = mockNow();
  const currentKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  return Array.from({ length: 13 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (12 - index), 1),
    );
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const previousMonth = `${date.getUTCFullYear() - 1}-${month.slice(5)}`;
    const entry = totals.get(month);

    return {
      month,
      netCents: entry?.netCents ?? 0,
      previousCents: totals.get(previousMonth)?.netCents ?? 0,
      enrollments: entry?.enrollments ?? 0,
      partial: month === currentKey,
    };
  });
}

export function getCommercialOverview(): CommercialOverview {
  const now = mockNow();

  const leadsMonth = LEADS.filter((lead) => inCurrentMonth(lead.receivedAt));
  const open = OPPORTUNITIES.filter((opportunity) => opportunity.status === "aberta");

  const closedMonth = OPPORTUNITIES.filter(
    (opportunity) =>
      opportunity.status !== "aberta" &&
      opportunity.closedAt &&
      inCurrentMonth(opportunity.closedAt),
  );
  const wonMonth = closedMonth.filter((opportunity) => opportunity.status === "ganha");
  const lostMonth = closedMonth.filter((opportunity) => opportunity.status === "perdida");

  const salesMonth = SALES.filter(
    (sale) => inCurrentMonth(sale.createdAt) && sale.commercialStatus !== "cancelada",
  );
  const enrollmentsCents = salesMonth.reduce((total, sale) => total + sale.netCents, 0);
  const listCents = salesMonth.reduce((total, sale) => total + sale.listPriceCents, 0);

  const overdueActions = NEXT_ACTIONS.filter(
    (action) => !action.doneAt && isOverdue(action.dueAt),
  );
  const withoutAction = open.filter((opportunity) => !openActionOf(opportunity.id));
  const stalled = open.filter(
    (opportunity) =>
      (now.getTime() - new Date(opportunity.stageChangedAt).getTime()) / 86_400_000 >=
      STALLED_DAYS,
  );
  const awaitingApproval = OPPORTUNITIES.filter(
    (opportunity) => opportunity.proposal?.approvalStatus === "aguardando_aprovacao",
  );
  const leadsWithoutOwner = LEADS.filter(
    (lead) => !lead.ownerId && lead.status !== "descartado" && lead.status !== "convertido",
  );
  const salesAwaiting = SALES.filter(
    (sale) => sale.commercialStatus === "aguardando_aprovacao",
  );

  const attention: AttentionItem[] = ([
    {
      id: "acao-vencida",
      label: "Follow-up vencido",
      count: overdueActions.length,
      hint: "Ação combinada que passou do prazo.",
      href: "/comercial/funil",
      tone: "error",
    },
    {
      id: "sem-acao",
      label: "Sem próxima ação",
      count: withoutAction.length,
      hint: "Oportunidade aberta que ninguém está tocando.",
      href: "/comercial/funil",
      tone: "warning",
    },
    {
      id: "paradas",
      label: "Paradas há 14 dias ou mais",
      count: stalled.length,
      hint: "Não mudam de etapa — costumam virar perda silenciosa.",
      href: "/comercial/funil",
      tone: "warning",
    },
    {
      id: "aprovacao",
      label: "Desconto aguardando decisão",
      count: awaitingApproval.length,
      hint: "Proposta acima da alçada, parada esperando a diretoria.",
      href: "/comercial/funil",
      tone: "info",
    },
    {
      id: "lead-sem-dono",
      label: "Lead sem dono",
      count: leadsWithoutOwner.length,
      hint: "Chegou e ninguém assumiu — é mídia paga esfriando.",
      href: "/comercial/leads",
      tone: "error",
    },
    {
      id: "venda-aprovacao",
      label: "Venda aguardando aprovação",
      count: salesAwaiting.length,
      hint: "Fechou no comercial e ainda não foi liberada.",
      href: "/comercial/vendas",
      tone: "info",
    },
  ] satisfies AttentionItem[]).filter((item) => item.count > 0);

  // Só quem carrega carteira entra no placar. Relacionadora apoia a venda —
  // ranqueá-la por valor vendido a colocaria eternamente com R$ 0, o que não
  // descreve o trabalho dela.
  const scoreboard: ScoreboardRow[] = CONSULTANTS.filter(
    (consultant) => consultant.role === "consultor",
  )
    .map((consultant) => {
      const consultantSales = salesMonth.filter((sale) => sale.sellerId === consultant.id);
      const consultantOpen = open.filter(
        (opportunity) => opportunity.ownerId === consultant.id,
      );
      const net = consultantSales.reduce((total, sale) => total + sale.netCents, 0);
      const list = consultantSales.reduce(
        (total, sale) => total + sale.listPriceCents,
        0,
      );

      return {
        consultantId: consultant.id,
        name: consultant.name,
        initials: consultant.initials,
        enrollments: consultantSales.length,
        netCents: net,
        openCount: consultantOpen.length,
        openCents: consultantOpen.reduce(
          (total, opportunity) => total + opportunity.amountCents,
          0,
        ),
        discountPercent: discountPercent(list, net),
      };
    })
    .sort((a, b) => b.netCents - a.netCents);

  const series = buildSeries();
  const currentMonth = series[series.length - 1];

  const live = EDITIONS.find((edition) => edition.status === "em_andamento");

  return {
    periodLabel: `1 a ${now.getUTCDate()} de ${now.toLocaleDateString("pt-BR", {
      month: "long",
      timeZone: "UTC",
    })}`,
    kpis: {
      leadsCount: leadsMonth.length,
      leadsWithoutOwner: leadsWithoutOwner.length,
      openCount: open.length,
      openCents: open.reduce((total, opportunity) => total + opportunity.amountCents, 0),
      enrollmentsCount: salesMonth.length,
      enrollmentsCents,
      listCents,
      averageDiscountPercent: discountPercent(listCents, enrollmentsCents),
      averageTicketCents:
        salesMonth.length > 0 ? Math.round(enrollmentsCents / salesMonth.length) : null,
      yoyPercent:
        currentMonth && currentMonth.previousCents > 0
          ? Math.round(
              ((currentMonth.netCents - currentMonth.previousCents) /
                currentMonth.previousCents) *
                1000,
            ) / 10
          : null,
      lostCount: lostMonth.length,
      winRatePercent:
        wonMonth.length + lostMonth.length > 0
          ? Math.round((wonMonth.length / (wonMonth.length + lostMonth.length)) * 1000) / 10
          : 0,
    },
    series,
    attention,
    scoreboard,
    liveEdition: live
      ? {
          edition: live,
          counters: roomCounters(live.id),
          productName: findProduct(live.productId)?.shortName ?? "—",
        }
      : undefined,
    nextEditions: upcomingEditions()
      .slice(0, 3)
      .map((edition) => {
        const sold = editionSold(edition);
        return {
          edition,
          productName: findProduct(edition.productId)?.shortName ?? "—",
          sold,
          occupancyPercent:
            edition.capacity > 0 ? Math.round((sold / edition.capacity) * 100) : 0,
        };
      }),
  };
}

/** Quantas pessoas da sala viraram matrícula — a conversão que sustenta o mês. */
export function roomConversionHint(editionId: string): string {
  const edition = findEdition(editionId);
  const list = ATTENDEES.filter((attendee) => attendee.editionId === editionId);
  if (!edition || list.length === 0) return "Sem sala aberta.";
  const counters = roomCounters(editionId);
  return `${counters.enrolled} matrículas em ${counters.checkedIn} presentes.`;
}

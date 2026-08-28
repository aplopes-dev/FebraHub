import {
  CONSULTANTS,
  FUNNELS,
  LEADS,
  PRODUCTS,
  findConsultant,
  findPerson,
  findProduct,
  firstContactMinutes,
  mockNow,
  upcomingEditions,
  type Lead,
} from "@/lib/mock-db";
import type {
  ChannelSummary,
  LeadFilters,
  LeadRow,
  LeadsBoard,
} from "@/features/leads/types/lead-view";

/**
 * Captação.
 *
 * O indicador que manda nesta tela **não é volume**, é tempo: lead que espera
 * horas por um retorno vale menos que lead nenhum, porque já custou mídia. Por
 * isso o SLA de primeiro contato e o "sem dono" vêm antes de qualquer total.
 */

/** Acima disso, o lead esfriou — régua de trabalho, não de contrato. */
const SLA_HOURS = 4;

function toRow(lead: Lead): LeadRow {
  const person = findPerson(lead.personId);
  const owner = findConsultant(lead.ownerId);
  const minutes = firstContactMinutes(lead);
  const waitingHours = Math.max(
    0,
    (mockNow().getTime() - new Date(lead.receivedAt).getTime()) / 3_600_000,
  );

  return {
    lead,
    personName: person?.name ?? "—",
    personPhone: person?.phone ?? "",
    personCity: person?.city ?? "—",
    ownerName: owner?.name,
    ownerInitials: owner?.initials,
    interestName: findProduct(lead.interestProductId ?? "")?.shortName,
    origin: lead.origin,
    firstContactMinutes: minutes,
    waitingHours: Math.round(waitingHours),
    slaBreached:
      minutes === undefined
        ? waitingHours > SLA_HOURS && lead.status !== "descartado"
        : minutes > SLA_HOURS * 60,
  };
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : sorted[middle];
}

export function getLeadsBoard(filters: LeadFilters): LeadsBoard {
  const all = LEADS.map(toRow);
  const term = filters.search.trim().toLowerCase();

  const rows = all.filter((row) => {
    if (filters.status !== "todos" && row.lead.status !== filters.status) return false;
    if (filters.channel !== "todos" && row.origin.channel !== filters.channel) return false;
    if (filters.onlyOrphans && row.lead.ownerId) return false;
    if (term) {
      const matches =
        row.personName.toLowerCase().includes(term) ||
        (row.origin.campaign?.toLowerCase().includes(term) ?? false);
      if (!matches) return false;
    }
    return true;
  });

  const channels = new Map<string, ChannelSummary>();
  all.forEach((row) => {
    const current = channels.get(row.origin.channel) ?? {
      channel: row.origin.channel,
      count: 0,
      converted: 0,
      conversionPercent: 0,
    };
    current.count += 1;
    if (row.lead.status === "convertido") current.converted += 1;
    channels.set(row.origin.channel, current);
  });

  const converted = all.filter((row) => row.lead.status === "convertido").length;

  return {
    rows: rows.sort((a, b) => b.lead.receivedAt.localeCompare(a.lead.receivedAt)),
    summary: {
      total: all.length,
      orphans: all.filter(
        (row) =>
          !row.lead.ownerId &&
          row.lead.status !== "descartado" &&
          row.lead.status !== "convertido",
      ).length,
      medianFirstContactMinutes: median(
        all
          .map((row) => row.firstContactMinutes)
          .filter((value): value is number => value !== undefined),
      ),
      slaBreached: all.filter((row) => row.slaBreached).length,
      convertedPercent:
        all.length > 0 ? Math.round((converted / all.length) * 1000) / 10 : 0,
    },
    channels: [...channels.values()]
      .map((item) => ({
        ...item,
        conversionPercent:
          item.count > 0 ? Math.round((item.converted / item.count) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export function getConversionOptions() {
  return {
    funnels: FUNNELS,
    products: PRODUCTS.filter((product) => product.active),
    owners: CONSULTANTS.filter((consultant) => consultant.role !== "gestor"),
    editions: upcomingEditions(),
  };
}

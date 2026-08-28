import {
  CONSULTANTS,
  EDITIONS,
  PRODUCTS,
  SALES,
  attendeesOfEdition,
  editionSold,
  editionTicketRevenueCents,
  findConsultant,
  findEdition,
  findPerson,
  findProduct,
  roomCounters,
  type Attendee,
} from "@/lib/mock-db";
import type {
  EditionDetail,
  EditionFunnel,
  EditionRow,
  RoomFilter,
  RoomRow,
} from "@/features/event-editions/types/edition-view";

/**
 * Camada de leitura das edições e da sala.
 *
 * Como no funil, é aqui que o dado vira linha pronta — e é aqui que a troca
 * pelo `apps/api` acontece quando o backend do comercial existir.
 */

function buildFunnel(editionId: string, tickets: number): EditionFunnel {
  const counters = roomCounters(editionId);
  const list = attendeesOfEdition(editionId);
  const base = list.length > 0 ? list.length : tickets;

  return {
    tickets: base,
    checkedIn: counters.checkedIn,
    approached: counters.approached,
    enrolled: counters.enrolled,
    refused: counters.refused,
    attendancePercent: base > 0 ? Math.round((counters.checkedIn / base) * 1000) / 10 : 0,
    approachPercent:
      counters.checkedIn > 0
        ? Math.round((counters.approached / counters.checkedIn) * 1000) / 10
        : 0,
    conversionPercent: counters.conversionPercent,
  };
}

export function listEditions(): EditionRow[] {
  return [...EDITIONS]
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map((edition) => {
      const sold = editionSold(edition);
      const room = attendeesOfEdition(edition.id);

      return {
        edition,
        productName: findProduct(edition.productId)?.shortName ?? "—",
        sold,
        capacity: edition.capacity,
        occupancyPercent:
          edition.capacity > 0 ? Math.round((sold / edition.capacity) * 100) : 0,
        ticketRevenueCents: editionTicketRevenueCents(edition),
        enrollments: room.filter((attendee) => attendee.status === "matriculado").length,
        hasRoom: room.length > 0,
      };
    });
}

export function getEditionDetail(editionId: string): EditionDetail | undefined {
  const edition = findEdition(editionId);
  if (!edition) return undefined;

  const sold = editionSold(edition);
  const room = attendeesOfEdition(edition.id);

  const enrollmentSales = room
    .filter((attendee) => attendee.saleId)
    .map((attendee) => {
      const sale = SALES.find((item) => item.id === attendee.saleId);
      if (!sale) return undefined;
      return {
        sale,
        buyerName: findPerson(sale.buyerId)?.name ?? "—",
        productName: findProduct(sale.productId)?.shortName ?? "—",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    edition,
    productName: findProduct(edition.productId)?.name ?? "—",
    tiers: edition.tiers.map((tier) => ({
      ...tier,
      revenueCents: tier.sold * tier.priceCents,
      occupancyPercent:
        tier.capacity > 0 ? Math.round((tier.sold / tier.capacity) * 100) : 0,
    })),
    ticketRevenueCents: editionTicketRevenueCents(edition),
    funnel: buildFunnel(edition.id, sold),
    hasRoom: room.length > 0,
    enrollmentSales,
  };
}

function toRoomRow(attendee: Attendee): RoomRow {
  const person = findPerson(attendee.personId);
  const consultant = findConsultant(attendee.consultantId);
  const edition = findEdition(attendee.editionId);
  const tier = edition?.tiers.find((item) => item.id === attendee.tierId);

  return {
    attendee,
    personName: person?.name ?? "—",
    personPhone: person?.phone ?? "",
    personCity: person?.city ?? "—",
    tierName: tier?.name ?? "—",
    consultantName: consultant?.name,
    consultantInitials: consultant?.initials,
  };
}

export type RoomData = {
  edition: ReturnType<typeof findEdition>;
  counters: ReturnType<typeof roomCounters>;
  rows: RoomRow[];
  consultants: typeof CONSULTANTS;
  products: typeof PRODUCTS;
};

export function getRoom(
  editionId: string,
  filter: RoomFilter,
  search: string,
): RoomData {
  const term = search.trim().toLowerCase();

  const rows = attendeesOfEdition(editionId)
    .map(toRoomRow)
    .filter((row) => {
      if (term) {
        const matches =
          row.personName.toLowerCase().includes(term) ||
          row.personPhone.includes(term.replace(/\D/g, ""));
        if (!matches) return false;
      }

      switch (filter) {
        case "todos":
          return true;
        case "na_sala":
          return Boolean(row.attendee.checkedInAt);
        // A fila de trabalho da sala: entrou e ninguém falou com a pessoa ainda.
        case "aguardando":
          return Boolean(row.attendee.checkedInAt) && !row.attendee.approachedAt;
        default:
          return row.attendee.status === filter;
      }
    })
    .sort((a, b) => a.personName.localeCompare(b.personName, "pt-BR"));

  return {
    edition: findEdition(editionId),
    counters: roomCounters(editionId),
    rows,
    consultants: CONSULTANTS.filter((consultant) => consultant.role !== "gestor"),
    products: PRODUCTS.filter(
      (product) => product.active && product.kind !== "evento",
    ),
  };
}

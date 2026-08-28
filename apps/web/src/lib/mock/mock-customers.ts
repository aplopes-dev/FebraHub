import { NextResponse } from "next/server";
import type {
  CustomerDetailDto,
  CustomerListItemDto,
} from "@/features/customers/api/customer.dto";
import {
  ATTENDEES,
  EDITIONS,
  OPPORTUNITIES,
  PEOPLE,
  SALES,
  findProduct,
  type Person,
} from "@/lib/mock-db";

/**
 * `/v1/customers` servido pelo banco de demonstração.
 *
 * A tela de Pessoas já fala `apiFetch` com o contrato herdado do ERP de
 * origem; popular pela **borda HTTP** dá gente de verdade para ela sem tocar em
 * nenhum service da feature — e sair daqui é apagar um arquivo.
 *
 * ⚠️ Este módulo roda no **servidor** (rota de proxy). Ele lê a mesma semente
 * do `mock-db`, mas é outra instância do módulo: uma matrícula registrada na
 * sala (cliente) não muda o papel desta listagem até o próximo restart. Para a
 * demonstração isso é aceitável; com API de verdade o problema não existe.
 */

type Stage = CustomerListItemDto["stage"];

/**
 * Papel Febracis → estágio do contrato do ERP.
 * Aluno vira "active", ex-aluno vira "inactive", quem tem negócio aberto vira
 * "opportunity" — o resto é lead.
 */
function toStage(person: Person): Stage {
  if (person.roles.includes("aluno")) return "active";
  if (person.roles.includes("ex_aluno")) return "inactive";
  const hasOpen = OPPORTUNITIES.some(
    (opportunity) =>
      opportunity.personId === person.id && opportunity.status === "aberta",
  );
  if (hasOpen) return "opportunity";
  return "lead";
}

function salesTotalReais(personId: string): number {
  return (
    SALES.filter(
      (sale) => sale.buyerId === personId && sale.commercialStatus !== "cancelada",
    ).reduce((total, sale) => total + sale.netCents, 0) / 100
  );
}

function toListItem(person: Person): CustomerListItemDto & { roles: string[] } {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    salesTotal: salesTotalReais(person.id),
    createdAt: person.createdAt,
    stage: toStage(person),
    categoryId: null,
    roles: person.roles,
  };
}

function toDetail(person: Person): CustomerDetailDto {
  return {
    id: person.id,
    personType: person.company ? "PJ" : "PF",
    name: person.name,
    document: person.document,
    rg: null,
    birthDate: null,
    email: person.email,
    mobilePhone: person.phone,
    phone: null,
    additionalPhones: [],
    stage: toStage(person),
    categoryId: null,
    notes: person.company ? `Empresa: ${person.company}` : "",
    addresses: [
      {
        id: `${person.id}-addr`,
        addressType: "principal",
        zipCode: null,
        street: null,
        number: null,
        district: null,
        city: person.city,
        state: person.state,
        complement: null,
      },
    ],
    branchIds: [],
    deletedAt: null,
    createdAt: person.createdAt,
    updatedAt: person.createdAt,
  };
}

/** A escada da pessoa: compras, eventos e indicações. */
function toJourney(person: Person) {
  const purchases = SALES.filter((sale) => sale.buyerId === person.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((sale) => ({
      id: sale.id,
      number: sale.number,
      productName: findProduct(sale.productId)?.shortName ?? "—",
      netCents: sale.netCents,
      listPriceCents: sale.listPriceCents,
      createdAt: sale.createdAt,
      commercialStatus: sale.commercialStatus,
      financialStatus: sale.financialStatus,
    }));

  const events = ATTENDEES.filter((attendee) => attendee.personId === person.id).map(
    (attendee) => {
      const edition = EDITIONS.find((item) => item.id === attendee.editionId);
      return {
        id: attendee.id,
        editionName: edition?.name ?? "—",
        startsAt: edition?.startsAt ?? "",
        status: attendee.status,
      };
    },
  );

  const referrals = PEOPLE.filter((other) => other.referredById === person.id).map(
    (other) => ({ id: other.id, name: other.name, createdAt: other.createdAt }),
  );

  const referredBy = person.referredById
    ? (PEOPLE.find((other) => other.id === person.referredById)?.name ?? null)
    : null;

  return { purchases, events, referrals, referredBy, roles: person.roles };
}

export function handleMockCustomersRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
): NextResponse | null {
  if (segments[0] !== "v1" || segments[1] !== "customers") return null;

  const id = segments[2];
  const sub = segments[3];

  if (method === "GET" && id && sub === "journey") {
    const person = PEOPLE.find((item) => item.id === id);
    if (!person) {
      return NextResponse.json(
        { error: { code: "NotFoundError", message: "Pessoa não encontrada." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: toJourney(person) });
  }

  if (method === "GET" && id) {
    const person = PEOPLE.find((item) => item.id === id);
    if (!person) {
      return NextResponse.json(
        { error: { code: "NotFoundError", message: "Pessoa não encontrada." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: toDetail(person) });
  }

  if (method === "GET") {
    const page = Number(searchParams.get("page") ?? 1);
    const perPage = Number(searchParams.get("perPage") ?? 10);
    const tab = searchParams.get("tab") ?? "all";
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();

    const all = PEOPLE.map(toListItem);
    const filtered = all.filter((item) => {
      if (tab !== "all" && item.stage !== tab) return false;
      if (search) {
        return (
          item.name.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search) ||
          item.phone.includes(search.replace(/\D/g, ""))
        );
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;

    return NextResponse.json({
      data: filtered.slice(start, start + perPage),
      meta: { total, page: safePage, perPage, totalPages },
      tabCounts: {
        all: all.length,
        lead: all.filter((item) => item.stage === "lead").length,
        opportunity: all.filter((item) => item.stage === "opportunity").length,
        active: all.filter((item) => item.stage === "active").length,
        inactive: all.filter((item) => item.stage === "inactive").length,
      },
    });
  }

  // Escrita: eco, para o formulário não travar (a demonstração é de leitura).
  return NextResponse.json(
    { data: { ...toDetail(PEOPLE[0]!), id: "psn-novo" } },
    { status: method === "POST" ? 201 : 200 },
  );
}

/**
 * Porte de aplopes-dev/hub · backend/src/modules/companies/companies.service.ts
 * Ajustes: caminho do PrismaService do FebraHub e import dos DTOs locais.
 * As consultas são idênticas às de produção do hub.aplopes.com.
 */
import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CompanyFiltersDto,
  ConnectionsQueryDto,
  ExportCompaniesDto,
  ListCompaniesDto,
} from "./territorial.dto";

const UF_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
  ND: "Não informado",
};

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type CompanyWithRelations = Prisma.CompanyGetPayload<{
  include: { partners: true; contacts: true };
}>;

function toApiCompany(c: CompanyWithRelations) {
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    document: c.document,
    documentType: c.documentType,
    nicheId: c.nicheId,
    cnae: c.cnae,
    cnaeDescription: c.cnaeDescription,
    state: c.state,
    city: c.city,
    latitude: c.latitude === null ? null : Number(c.latitude),
    longitude: c.longitude === null ? null : Number(c.longitude),
    revenue: Number(c.revenue),
    revenueRangeId: c.revenueRange,
    employeeCount: c.employeeCount,
    partners: c.partners.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      ownershipPercentage: p.ownershipPercentage,
    })),
    contacts: c.contacts.map((k) => ({
      id: k.id,
      type: k.type,
      value: k.value,
      isPrimary: k.isPrimary,
      verified: k.verified,
    })),
    website: c.website,
    status: c.status,
    openedAt: c.openedAt.toISOString().slice(0, 10),
    updatedAt: c.updatedAt.toISOString(),
    score: c.score,
    groupId: c.groupId,
    groupName: c.groupName,
  };
}

@Injectable()
export class TerritorialService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildWhere(f: CompanyFiltersDto): Promise<Prisma.CompanyWhereInput> {
    const where: Prisma.CompanyWhereInput = {};
    const and: Prisma.CompanyWhereInput[] = [];

    if (f.nicheIds?.length) where.nicheId = { in: f.nicheIds };
    if (f.states?.length) where.state = { in: f.states };
    if (f.cities?.length) where.city = { in: f.cities };
    if (f.status?.length) where.status = { in: f.status as never };
    if (f.documentTypes?.length) where.documentType = { in: f.documentTypes };

    if (f.revenueMin !== undefined || f.revenueMax !== undefined) {
      where.revenue = {
        ...(f.revenueMin !== undefined ? { gte: new Prisma.Decimal(f.revenueMin) } : {}),
        ...(f.revenueMax !== undefined ? { lte: new Prisma.Decimal(f.revenueMax) } : {}),
      };
    }
    if (f.revenueRanges?.length) where.revenueRange = { in: f.revenueRanges };

    if (f.employeesMin !== undefined || f.employeesMax !== undefined) {
      where.employeeCount = {
        ...(f.employeesMin !== undefined ? { gte: f.employeesMin } : {}),
        ...(f.employeesMax !== undefined ? { lte: f.employeesMax } : {}),
      };
    }

    if (f.openedFrom !== undefined) {
      and.push({ openedAt: { gte: new Date(Date.UTC(f.openedFrom, 0, 1)) } });
    }
    if (f.openedTo !== undefined) {
      and.push({ openedAt: { lte: new Date(Date.UTC(f.openedTo, 11, 31)) } });
    }

    if (f.hasContact === true) and.push({ contacts: { some: {} } });
    if (f.hasContact === false) and.push({ contacts: { none: {} } });
    if (f.hasPhone === true) and.push({ contacts: { some: { type: "telefone" } } });
    if (f.hasPhone === false) and.push({ contacts: { none: { type: "telefone" } } });
    if (f.hasEmail === true) and.push({ contacts: { some: { type: "email" } } });
    if (f.hasEmail === false) and.push({ contacts: { none: { type: "email" } } });
    if (f.hasWebsite === true) where.website = { not: null };
    if (f.hasWebsite === false) where.website = null;

    if (f.search) {
      for (const token of normalizeSearch(f.search).split(/\s+/).filter(Boolean)) {
        and.push({ searchText: { contains: token } });
      }
    }

    // Mínimo de sócios: resolvido por agregação (Prisma não filtra count em where)
    if (f.partnersMin !== undefined && f.partnersMin > 1) {
      const groups = await this.prisma.companyPartner.groupBy({
        by: ["companyId"],
        having: { companyId: { _count: { gte: f.partnersMin } } },
      });
      and.push({ id: { in: groups.map((g) => g.companyId) } });
    } else if (f.partnersMin === 1) {
      and.push({ partners: { some: {} } });
    }

    if (and.length) where.AND = and;
    return where;
  }

  private orderBy(sortBy: string, order: "asc" | "desc"): Prisma.CompanyOrderByWithRelationInput[] {
    const map: Record<string, Prisma.CompanyOrderByWithRelationInput> = {
      legalName: { legalName: order },
      tradeName: { tradeName: order },
      state: { state: order },
      city: { city: order },
      niche: { nicheId: order },
      cnae: { cnae: order },
      revenue: { revenue: order },
      revenueRange: { revenueRange: order },
      partners: { partners: { _count: order } },
      employeeCount: { employeeCount: order },
      status: { status: order },
      openedAt: { openedAt: order },
      updatedAt: { updatedAt: order },
      score: { score: order },
    };
    return [map[sortBy] ?? { revenue: order }, { id: "asc" }];
  }

  async list(query: ListCompaniesDto) {
    const where = await this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        include: { partners: true, contacts: true },
        orderBy: this.orderBy(query.sortBy ?? "revenue", query.sortOrder ?? "desc"),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: items.map(toApiCompany),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async mapPoints(filters: CompanyFiltersDto) {
    const where = await this.buildWhere(filters);
    const [rows, withoutCoordinates] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where: { ...where, latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          city: true,
          state: true,
          nicheId: true,
          latitude: true,
          longitude: true,
          revenue: true,
          revenueRange: true,
          employeeCount: true,
          score: true,
          status: true,
          website: true,
          _count: { select: { partners: true, contacts: true } },
        },
      }),
      this.prisma.company.count({ where: { ...where, latitude: null } }),
    ]);
    return {
      points: rows.map((c) => ({
        id: c.id,
        name: c.tradeName || c.legalName,
        city: c.city,
        state: c.state,
        nicheId: c.nicheId,
        position: [Number(c.longitude), Number(c.latitude)] as [number, number],
        revenue: Number(c.revenue),
        revenueRangeId: c.revenueRange,
        employeeCount: c.employeeCount,
        partnersCount: c._count.partners,
        score: c.score,
        hasContact: c._count.contacts > 0,
        status: c.status,
      })),
      withoutCoordinates,
    };
  }

  async metrics(filters: CompanyFiltersDto) {
    const where = await this.buildWhere(filters);
    // Preserva o AND existente do where — sobrescrever apagaria busca/hasPhone/etc.
    const withContactWhere: Prisma.CompanyWhereInput = {
      ...where,
      AND: [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { contacts: { some: {} } },
      ],
    };
    const [agg, states, cityGroups, nicheGroups, withContact, partnersTotal, withoutCoordinates] =
      await Promise.all([
        this.prisma.company.aggregate({
          where,
          _count: true,
          _sum: { revenue: true, employeeCount: true },
          _avg: { revenue: true },
          _max: { updatedAt: true },
        }),
        this.prisma.company.groupBy({ by: ["state"], where, _count: true }),
        this.prisma.company.groupBy({
          by: ["city", "state"],
          where,
          _count: true,
          orderBy: [{ _count: { city: "desc" } }, { city: "asc" }],
        }),
        this.prisma.company.groupBy({
          by: ["nicheId"],
          where,
          _count: true,
          orderBy: [{ _count: { nicheId: "desc" } }, { nicheId: "asc" }],
        }),
        this.prisma.company.count({ where: withContactWhere }),
        this.prisma.companyPartner.count({ where: { company: where } }),
        this.prisma.company.count({ where: { ...where, latitude: null } }),
      ]);

    const total = agg._count;
    const topCity = cityGroups[0]
      ? { name: cityGroups[0].city, uf: cityGroups[0].state, count: cityGroups[0]._count }
      : null;
    const topNiche = nicheGroups[0]
      ? { id: nicheGroups[0].nicheId, count: nicheGroups[0]._count }
      : null;

    return {
      total,
      stateCount: states.length,
      cityCount: cityGroups.length,
      nicheCount: nicheGroups.length,
      revenueSum: Number(agg._sum.revenue ?? 0),
      revenueAvg: Number(agg._avg.revenue ?? 0),
      withContact,
      withContactPct: total ? (withContact / total) * 100 : 0,
      partnersTotal,
      employeesTotal: agg._sum.employeeCount ?? 0,
      withoutCoordinates,
      topCity,
      topNiche,
      lastUpdatedAt: agg._max.updatedAt?.toISOString() ?? null,
    };
  }

  async connections(query: ConnectionsQueryDto) {
    const types = query.types?.length ? query.types : ["grupo", "socio", "comercial"];
    const limit = query.limit ?? 400;
    const companyWhere = await this.buildWhere(query);
    const visibleCompany: Prisma.CompanyWhereInput = {
      ...companyWhere,
      latitude: { not: null },
    };
    const where: Prisma.CompanyConnectionWhereInput = {
      type: { in: types as never },
      source: visibleCompany,
      target: visibleCompany,
      ...(query.focusCompanyId
        ? {
            OR: [
              { sourceCompanyId: query.focusCompanyId },
              { targetCompanyId: query.focusCompanyId },
            ],
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.companyConnection.count({ where }),
      this.prisma.companyConnection.findMany({
        where,
        orderBy: [{ strength: "desc" }, { id: "asc" }],
        take: limit,
      }),
    ]);
    return {
      connections: rows.map((k) => ({
        id: k.id,
        sourceCompanyId: k.sourceCompanyId,
        targetCompanyId: k.targetCompanyId,
        type: k.type,
        strength: Number(k.strength),
        nicheId: k.nicheId,
        metadata: (k.metadata ?? {}) as { label?: string },
      })),
      total,
      truncated: total > rows.length,
    };
  }

  async detail(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { partners: true, contacts: true },
    });
    if (!company) throw new NotFoundException("Empresa não encontrada");
    const related = await this.prisma.companyConnection.findMany({
      where: { OR: [{ sourceCompanyId: id }, { targetCompanyId: id }] },
      include: {
        source: { select: { id: true, legalName: true, tradeName: true, city: true, state: true, nicheId: true } },
        target: { select: { id: true, legalName: true, tradeName: true, city: true, state: true, nicheId: true } },
      },
      orderBy: { strength: "desc" },
    });
    return {
      company: toApiCompany(company),
      connections: related.map((k) => {
        const other = k.sourceCompanyId === id ? k.target : k.source;
        return {
          connection: {
            id: k.id,
            sourceCompanyId: k.sourceCompanyId,
            targetCompanyId: k.targetCompanyId,
            type: k.type,
            strength: Number(k.strength),
            nicheId: k.nicheId,
            metadata: (k.metadata ?? {}) as { label?: string },
          },
          other: {
            id: other.id,
            name: other.tradeName || other.legalName,
            city: other.city,
            state: other.state,
            nicheId: other.nicheId,
          },
        };
      }),
    };
  }

  async export(query: ExportCompaniesDto) {
    const where = await this.buildWhere(query);
    const limit = query.limit ?? 5000;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        include: { partners: true, contacts: true },
        orderBy: [{ revenue: "desc" }, { id: "asc" }],
        take: limit,
      }),
    ]);
    return { data: items.map(toApiCompany), total, truncated: total > items.length };
  }

  async nicheCounts(filters: CompanyFiltersDto) {
    const where = await this.buildWhere(filters);
    const groups = await this.prisma.company.groupBy({ by: ["nicheId"], where, _count: true });
    return groups.map((g) => ({ nicheId: g.nicheId, count: g._count }));
  }

  async statesSummary() {
    const groups = await this.prisma.company.groupBy({ by: ["state"], _count: true });
    // UFs presentes nos dados, das mais populosas para as menos; "ND" (sem UF) por último
    return groups
      .sort((a, b) =>
        (a.state === "ND" ? 1 : 0) - (b.state === "ND" ? 1 : 0) ||
        b._count - a._count ||
        a.state.localeCompare(b.state),
      )
      .map((g) => ({
        id: g.state,
        name: UF_NAMES[g.state] ?? g.state,
        count: g._count,
      }));
  }

  async citiesSummary(states?: string[]) {
    const groups = await this.prisma.company.groupBy({
      by: ["city", "state"],
      where: states?.length ? { state: { in: states } } : undefined,
      _count: true,
      orderBy: [{ _count: { city: "desc" } }, { city: "asc" }],
    });
    // Agrega por NOME: o filtro de cidades opera por nome (city IN ...), então
    // homônimos e o marcador "Não informada" viram uma entrada única.
    // UF exibida = a do maior contribuinte.
    const byName = new Map<string, { name: string; uf: string; count: number; top: number }>();
    for (const g of groups) {
      const e = byName.get(g.city);
      if (e) {
        e.count += g._count;
        if (g._count > e.top) {
          e.top = g._count;
          e.uf = g.state;
        }
      } else {
        byName.set(g.city, { name: g.city, uf: g.state, count: g._count, top: g._count });
      }
    }
    return [...byName.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map(({ name, uf, count }) => ({ name, uf, count }));
  }
}

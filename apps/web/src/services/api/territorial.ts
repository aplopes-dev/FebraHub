/* Chamadas da Inteligência Territorial — /api/territorial/* (admin). */

import { api } from "./client";
import type {
  CitySummary,
  Company,
  ConexoesResposta,
  FiltrosTerritorial,
  ListaEmpresas,
  Metrics,
  NicheSummary,
  PontosMapa,
  StateSummary,
} from "@/lib/territorial/tipos";

type Parametros = Record<string, string | number | boolean | null | undefined>;

/** Filtros → querystring no formato do backend (arrays viram CSV).
 *  showConnections/connectionTypes NÃO entram aqui: são estado da camada de
 *  conexões da interface — os tipos vão só como `types` no endpoint próprio. */
export function paramsDe(f: FiltrosTerritorial): Parametros {
  return {
    search: f.search || undefined,
    nicheIds: f.nicheIds?.length ? f.nicheIds.join(",") : undefined,
    states: f.states?.length ? f.states.join(",") : undefined,
    cities: f.cities?.length ? f.cities.join(",") : undefined,
    revenueRanges: f.revenueRanges?.length ? f.revenueRanges.join(",") : undefined,
    employeesMin: f.employeesMin,
    employeesMax: f.employeesMax,
    status: f.status?.length ? f.status.join(",") : undefined,
    documentTypes: f.documentTypes?.length ? f.documentTypes.join(",") : undefined,
    partnersMin: f.partnersMin,
    openedFrom: f.openedFrom,
    openedTo: f.openedTo,
    hasContact: f.hasContact,
    hasPhone: f.hasPhone,
    hasEmail: f.hasEmail,
    hasWebsite: f.hasWebsite,
  };
}

export const listarEmpresas = (
  f: FiltrosTerritorial,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
): Promise<ListaEmpresas> =>
  api.get("/territorial/companies", { parametros: { ...paramsDe(f), page, limit, sortBy, sortOrder } });

export const pontosMapa = (f: FiltrosTerritorial): Promise<PontosMapa> =>
  api.get("/territorial/companies/map", { parametros: paramsDe(f) });

export const metricasTerritorial = (f: FiltrosTerritorial): Promise<Metrics> =>
  api.get("/territorial/companies/metrics", { parametros: paramsDe(f) });

export const conexoesTerritorial = (
  f: FiltrosTerritorial,
  focusCompanyId?: string
): Promise<ConexoesResposta> =>
  api.get("/territorial/companies/connections", {
    parametros: {
      ...paramsDe(f),
      // Tipos selecionados na seção "Conexões": omitido = todos (padrão do
      // backend); mandamos só quando é um subconjunto real.
      types:
        f.connectionTypes.length > 0 && f.connectionTypes.length < 3
          ? f.connectionTypes.join(",")
          : undefined,
      focusCompanyId,
    },
  });

export const detalheEmpresa = (
  id: string
): Promise<{ company: Company; connections: { connection: ConexoesResposta["connections"][number]; other: { id: string; name: string; city: string; state: string; nicheId: string } }[] }> =>
  api.get(`/territorial/companies/${encodeURIComponent(id)}`);

export const exportarEmpresas = (f: FiltrosTerritorial): Promise<{ data: Company[]; total: number; truncated: boolean }> =>
  api.get("/territorial/companies/export", { parametros: paramsDe(f) });

export const nichosTerritorial = (f: FiltrosTerritorial): Promise<NicheSummary[]> =>
  api.get("/territorial/niches", { parametros: paramsDe(f) });

export const estadosTerritorial = (): Promise<StateSummary[]> => api.get("/territorial/locations/states");

export const cidadesTerritorial = (states?: string[]): Promise<CitySummary[]> =>
  api.get("/territorial/locations/cities", {
    parametros: { states: states?.length ? states.join(",") : undefined },
  });

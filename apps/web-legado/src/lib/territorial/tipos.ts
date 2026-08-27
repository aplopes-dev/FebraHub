/**
 * Porte de aplopes-dev/hub · frontend/src/data/types.ts — tipos de domínio da
 * Inteligência Territorial, espelho das respostas de /api/territorial/*.
 */
import type { NicheId } from "./nichos";

export type UF =
  | "AC" | "AL" | "AP" | "AM" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA"
  | "MT" | "MS" | "MG" | "PA" | "PB" | "PR" | "PE" | "PI" | "RJ" | "RN"
  | "RS" | "RO" | "RR" | "SC" | "SP" | "SE" | "TO"
  | "ND";

export type DocumentType = "cnpj" | "cpf" | "nd";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cnpj: "CNPJ",
  cpf: "CPF",
  nd: "Sem documento",
};

export type CompanyStatus = "ativa" | "suspensa" | "inapta" | "baixada";

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  inapta: "Inapta",
  baixada: "Baixada",
};

export type ConnectionType = "grupo" | "socio" | "comercial";

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  grupo: "Grupo econômico",
  socio: "Sócio em comum",
  comercial: "Relação comercial",
};

export const CONNECTION_TYPES: ConnectionType[] = ["grupo", "socio", "comercial"];

/** Métrica que dá o raio do ponto no mapa (porte de data/types.ts do hub). */
export type SizeMode = "revenue" | "employees" | "score" | "uniform";

export interface RevenueRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

/** Faixas de faturamento — mesmas do hub original (r1..r5). */
export const REVENUE_RANGES: RevenueRange[] = [
  { id: "r1", label: "Até R$ 360 mil", min: 0, max: 360_000 },
  { id: "r2", label: "R$ 360 mil – 4,8 mi", min: 360_000, max: 4_800_000 },
  { id: "r3", label: "R$ 4,8 mi – 30 mi", min: 4_800_000, max: 30_000_000 },
  { id: "r4", label: "R$ 30 mi – 100 mi", min: 30_000_000, max: 100_000_000 },
  { id: "r5", label: "Acima de R$ 100 mi", min: 100_000_000, max: null },
];

export const REVENUE_RANGE_MAP: Record<string, RevenueRange> = Object.fromEntries(
  REVENUE_RANGES.map((r) => [r.id, r]),
);

export interface CompanyPartner {
  id: string;
  name: string;
  role: string;
  ownershipPercentage: number;
}

export type ContactType = "telefone" | "email" | "site";

export interface CompanyContact {
  id: string;
  type: ContactType;
  value: string;
  isPrimary: boolean;
  verified: boolean;
}

export interface Company {
  id: string;
  legalName: string;
  tradeName: string;
  document: string;
  documentType: DocumentType;
  nicheId: NicheId;
  cnae: string;
  cnaeDescription: string;
  state: UF;
  city: string;
  latitude: number | null;
  longitude: number | null;
  revenue: number;
  revenueRangeId: string;
  employeeCount: number;
  partners: CompanyPartner[];
  contacts: CompanyContact[];
  website: string | null;
  status: CompanyStatus;
  openedAt: string;
  updatedAt: string;
  score: number;
  groupId: string | null;
  groupName: string | null;
}

export interface CompanyConnection {
  id: string;
  sourceCompanyId: string;
  targetCompanyId: string;
  type: ConnectionType;
  strength: number;
  nicheId: NicheId;
  metadata: { label?: string };
}

export interface MapPoint {
  id: string;
  name: string;
  city: string;
  state: UF;
  nicheId: NicheId;
  position: [number, number]; // [lng, lat]
  revenue: number;
  revenueRangeId: string;
  employeeCount: number;
  partnersCount: number;
  score: number;
  hasContact: boolean;
  status: CompanyStatus;
}

export interface Metrics {
  total: number;
  stateCount: number;
  cityCount: number;
  nicheCount: number;
  revenueSum: number;
  revenueAvg: number;
  withContact: number;
  withContactPct: number;
  partnersTotal: number;
  employeesTotal: number;
  withoutCoordinates: number;
  topCity: { name: string; uf: UF; count: number } | null;
  topNiche: { id: NicheId; count: number } | null;
  lastUpdatedAt?: string | null;
}

export interface NicheSummary {
  id: string;
  slug: NicheId;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface StateSummary {
  id: UF;
  name: string;
  count: number;
}

export interface CitySummary {
  name: string;
  uf: UF;
  count: number;
}

/** Filtros aceitos por /api/territorial/* (espelho do CompanyFiltersDto),
 *  mais o estado de conexões que só a interface consome (showConnections /
 *  connectionTypes não vão para os endpoints de dados; os tipos vão apenas
 *  como `types` no endpoint de conexões). */
export interface FiltrosTerritorial {
  search?: string;
  nicheIds?: string[];
  states?: string[];
  cities?: string[];
  revenueRanges?: string[];
  employeesMin?: number;
  employeesMax?: number;
  status?: string[];
  documentTypes?: string[];
  partnersMin?: number;
  openedFrom?: number;
  openedTo?: number;
  hasContact?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
  /** Estado da camada de conexões (padrão: true). Não é filtro de dados. */
  showConnections: boolean;
  /** Tipos de conexão exibidos (padrão: todos). Vazio = nenhuma conexão. */
  connectionTypes: ConnectionType[];
}

export interface ListaEmpresas {
  data: Company[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PontosMapa {
  points: MapPoint[];
  withoutCoordinates: number;
}

export interface ConexoesResposta {
  connections: CompanyConnection[];
  total: number;
  truncated: boolean;
}

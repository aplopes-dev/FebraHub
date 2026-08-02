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

/** Filtros aceitos por /api/territorial/* (espelho do CompanyFiltersDto). */
export interface FiltrosTerritorial {
  search?: string;
  nicheIds?: string[];
  states?: string[];
  cities?: string[];
  status?: string[];
  documentTypes?: string[];
  partnersMin?: number;
  hasContact?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
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

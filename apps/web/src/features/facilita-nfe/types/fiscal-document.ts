/**
 * Tipos de domínio da tela Facilita NFE (aba "Emitido") — ver
 * `specs/erp/009-facilita-nfe-screen/data-model.md`.
 *
 * Nesta entrega só a aba "Emitido" tem dado real; "Recebido" e "Histórico de
 * Envios" são placeholders (ver `spec.md` `## Clarifications`).
 */

export const FISCAL_DOCUMENT_TYPES = ["NFE", "NFSE", "NFCE"] as const;
export type FiscalDocumentType = (typeof FISCAL_DOCUMENT_TYPES)[number];

export const FISCAL_DOCUMENT_STATUSES = [
  "DRAFT",
  "VALIDATING",
  "NUMBER_RESERVED",
  "XML_GENERATED",
  "SIGNED",
  "SENT",
  "PROCESSING",
  "AUTHORIZED",
  "REJECTED",
  "DENIED",
  "CANCEL_REQUESTED",
  "CANCEL_AUTHORIZED",
  "CANCEL_REJECTED",
  "CORRECTION_LETTER_AUTHORIZED",
  "INUTILIZED",
  "ERROR",
  "SYNC_REQUIRED",
] as const;
export type FiscalDocumentStatus = (typeof FISCAL_DOCUMENT_STATUSES)[number];

/** Projeção consumida pela tabela "Emitido" (FR-004). */
export type FiscalDocumentListItem = {
  id: string;
  documentType: FiscalDocumentType;
  status: FiscalDocumentStatus;
  series: string | null;
  number: string | null;
  /** Centavos. */
  totalAmountCents: number;
  issuedAt: string | null;
  customerName: string | null;
};

export type FiscalDocumentListResult = {
  data: FiscalDocumentListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/** Cards de totais — só 3 têm dado real (FR-003). */
export type FiscalDocumentSummary = {
  total: number;
  authorized: number;
  cancelled: number;
};

export type FacilitaNfeIssuedFilters = {
  status: FiscalDocumentStatus | null;
  documentType: FiscalDocumentType | null;
};

export function createEmptyFacilitaNfeIssuedFilters(): FacilitaNfeIssuedFilters {
  return { status: null, documentType: null };
}

export function countActiveFacilitaNfeFilters(
  filters: FacilitaNfeIssuedFilters,
): number {
  return (filters.status ? 1 : 0) + (filters.documentType ? 1 : 0);
}

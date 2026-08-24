import type { FiscalDocumentType } from '../../domain/entities/fiscal-document.entity';
export type ListFiscalDocumentsDto = {
  companyId: string;
  page?: number;
  perPage?: number;
  documentType?: FiscalDocumentType;
  status?: string;
  sourceSystem?: string;
  externalReference?: string;
  issuedFrom?: Date;
  issuedTo?: Date;
  /// Busca livre por `number`/`series` (spec `009-facilita-nfe-screen`, FR-005) —
  /// nome de cliente ficou fora do escopo (research.md §3 dessa spec).
  search?: string;
};

/// `GET /v1/fiscal-documents/summary` — mesmos filtros da listagem, exceto
/// paginação/status (o summary calcula os buckets de status).
export type GetFiscalDocumentsSummaryDto = {
  companyId: string;
  documentType?: FiscalDocumentType;
  sourceSystem?: string;
  externalReference?: string;
  search?: string;
};

export type GetFiscalDocumentDto = {
  fiscalDocumentId: string;
};

export type ListFiscalDocumentEventsDto = {
  fiscalDocumentId: string;
};

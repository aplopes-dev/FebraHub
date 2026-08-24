import type {
  FiscalDocumentStatus,
  FiscalDocumentType,
} from "@/features/facilita-nfe/types/fiscal-document";

/** Espelha `toFiscalDocumentResponse` de `services/fiscal-api`. */
export type FiscalDocumentDto = {
  documentId: string;
  companyId: string;
  customerId: string | null;
  customerName: string | null;
  documentType: FiscalDocumentType;
  status: FiscalDocumentStatus;
  series: string | null;
  number: string | null;
  totalAmount: number;
  issuedAt: string | null;
};

export type FiscalDocumentListResponseDto = {
  data: FiscalDocumentDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/** Espelha `FiscalDocumentSummaryPresenter` (`GET /v1/fiscal-documents/summary`). */
export type FiscalDocumentSummaryDto = {
  total: number;
  authorized: number;
  cancelled: number;
};

export type FiscalDocumentSummaryResponseDto = {
  data: FiscalDocumentSummaryDto;
};

/** Espelha `CompanyPresenter` (`GET /v1/companies`) — só os campos usados aqui. */
export type FiscalCompanyDto = {
  id: string;
  storeId: string;
  cnpj: string;
  active: boolean;
  /** spec erp/025 (P2) — ambiente real do Emitente, nunca assumido fixo pela tela. */
  defaultEnvironment: "HOMOLOGATION" | "PRODUCTION";
};

export type FiscalCompanyListResponseDto = {
  data: FiscalCompanyDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

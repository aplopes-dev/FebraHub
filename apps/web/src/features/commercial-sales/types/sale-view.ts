import type { CommercialStatus, FinancialStatus, Sale } from "@/lib/mock-db";

export type CommercialSaleRow = {
  sale: Sale;
  buyerName: string;
  beneficiaryName?: string;
  productName: string;
  editionName?: string;
  sellerName: string;
  sellerInitials: string;
  discountPercent: number;
  /** Quanto do valor já foi pago, segundo o plano de parcelas. */
  paidCents: number;
  overdueCount: number;
};

export type SalesTab = "todas" | CommercialStatus;

export type SalesFilters = {
  tab: SalesTab;
  financial: FinancialStatus | "todos";
  search: string;
};

export type SalesBoard = {
  rows: CommercialSaleRow[];
  tabCounts: Record<SalesTab, number>;
  summary: {
    netCents: number;
    listCents: number;
    discountPercent: number;
    awaitingApproval: number;
    overdue: number;
  };
};

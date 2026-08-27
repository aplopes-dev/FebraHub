import type {
  FiscalDocumentDto,
  FiscalDocumentSummaryDto,
} from "@/features/facilita-nfe/api/fiscal-document.dto";
import type {
  FiscalDocumentListItem,
  FiscalDocumentSummary,
} from "@/features/facilita-nfe/types/fiscal-document";

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function toFiscalDocumentListItem(
  dto: FiscalDocumentDto,
): FiscalDocumentListItem {
  return {
    id: dto.documentId,
    documentType: dto.documentType,
    status: dto.status,
    series: dto.series,
    number: dto.number,
    totalAmountCents: toCents(dto.totalAmount),
    issuedAt: dto.issuedAt,
    customerName: dto.customerName,
  };
}

export function toFiscalDocumentSummary(
  dto: FiscalDocumentSummaryDto,
): FiscalDocumentSummary {
  return {
    total: dto.total,
    authorized: dto.authorized,
    cancelled: dto.cancelled,
  };
}

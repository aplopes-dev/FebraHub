import { ReportSalesByProfessionalRepository } from '../domain/repositories/report-sales-by-professional.repository';
import {
  REPORT_SALES_UNINFORMED_PROFESSIONAL,
  type ListReportSalesByProfessionalCriteria,
  type ListReportSalesByProfessionalResult,
  type ReportSalesByProfessionalRow,
} from '../domain/report-sales-by-professional.types';

type StoredSaleItem = {
  id: string;
  storeId: string;
  budgetStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt: string | null;
  budgetDate: string;
  professionalName: string | null;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

function resolveSaleDate(item: StoredSaleItem): string {
  return item.approvedAt ?? item.budgetDate;
}

export class InMemoryReportSalesByProfessionalRepository extends ReportSalesByProfessionalRepository {
  private readonly items: StoredSaleItem[] = [];

  seed(items: readonly StoredSaleItem[]): void {
    this.items.splice(0, this.items.length, ...items);
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByProfessionalCriteria,
  ): Promise<ListReportSalesByProfessionalResult> {
    const matched = this.items
      .filter((item) => item.storeId === storeId)
      .filter((item) => item.budgetStatus === 'approved')
      .filter((item) => {
        if (item.approvedAt !== null) {
          return (
            item.approvedAt >= criteria.startDate &&
            item.approvedAt <= criteria.endDate
          );
        }
        return (
          item.budgetDate >= criteria.startDate &&
          item.budgetDate <= criteria.endDate
        );
      })
      .map(
        (item): ReportSalesByProfessionalRow => ({
          id: item.id,
          professionalName:
            item.professionalName?.trim() ||
            REPORT_SALES_UNINFORMED_PROFESSIONAL,
          saleDate: resolveSaleDate(item),
          patientName: item.patientName,
          treatmentName: item.treatmentName,
          valueCents: item.valueCents,
        }),
      )
      .sort((a, b) => {
        if (a.saleDate !== b.saleDate) {
          return b.saleDate.localeCompare(a.saleDate);
        }
        if (a.professionalName !== b.professionalName) {
          return a.professionalName.localeCompare(b.professionalName, 'pt-BR');
        }
        return b.id.localeCompare(a.id);
      });

    const total = matched.length;
    const pageItems = matched.slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );
    return { items: pageItems, total };
  }
}

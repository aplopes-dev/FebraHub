import { ReportSalesByTreatmentRepository } from '../domain/repositories/report-sales-by-treatment.repository';
import {
  REPORT_SALES_UNINFORMED_PLAN,
  REPORT_SALES_UNINFORMED_TREATMENT,
  type ListReportSalesByTreatmentCriteria,
  type ListReportSalesByTreatmentResult,
  type ReportSalesByTreatmentRow,
} from '../domain/report-sales-by-treatment.types';

type StoredSaleItem = {
  id: string;
  storeId: string;
  budgetStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt: string | null;
  budgetDate: string;
  treatmentName: string | null;
  planName: string | null;
  patientName: string;
  valueCents: number;
};

function resolveSaleDate(item: StoredSaleItem): string {
  return item.approvedAt ?? item.budgetDate;
}

export class InMemoryReportSalesByTreatmentRepository extends ReportSalesByTreatmentRepository {
  private readonly items: StoredSaleItem[] = [];

  seed(items: readonly StoredSaleItem[]): void {
    this.items.splice(0, this.items.length, ...items);
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByTreatmentCriteria,
  ): Promise<ListReportSalesByTreatmentResult> {
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
        (item): ReportSalesByTreatmentRow => ({
          id: item.id,
          treatmentName:
            item.treatmentName?.trim() || REPORT_SALES_UNINFORMED_TREATMENT,
          saleDate: resolveSaleDate(item),
          patientName: item.patientName,
          planName: item.planName?.trim() || REPORT_SALES_UNINFORMED_PLAN,
          valueCents: item.valueCents,
        }),
      )
      .sort((a, b) => {
        if (a.saleDate !== b.saleDate) {
          return b.saleDate.localeCompare(a.saleDate);
        }
        if (a.treatmentName !== b.treatmentName) {
          return a.treatmentName.localeCompare(b.treatmentName, 'pt-BR');
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

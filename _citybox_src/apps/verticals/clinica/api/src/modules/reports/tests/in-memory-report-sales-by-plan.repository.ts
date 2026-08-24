import { ReportSalesByPlanRepository } from '../domain/repositories/report-sales-by-plan.repository';
import {
  REPORT_SALES_UNINFORMED_PLAN,
  type ListReportSalesByPlanCriteria,
  type ListReportSalesByPlanResult,
  type ReportSalesByPlanRow,
} from '../domain/report-sales-by-plan.types';

type StoredSaleItem = {
  id: string;
  storeId: string;
  budgetStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt: string | null;
  budgetDate: string;
  planName: string | null;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

function resolveSaleDate(item: StoredSaleItem): string {
  return item.approvedAt ?? item.budgetDate;
}

export class InMemoryReportSalesByPlanRepository extends ReportSalesByPlanRepository {
  private readonly items: StoredSaleItem[] = [];

  seed(items: readonly StoredSaleItem[]): void {
    this.items.splice(0, this.items.length, ...items);
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesByPlanCriteria,
  ): Promise<ListReportSalesByPlanResult> {
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
        (item): ReportSalesByPlanRow => ({
          id: item.id,
          planName: item.planName?.trim() || REPORT_SALES_UNINFORMED_PLAN,
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
        if (a.planName !== b.planName) {
          return a.planName.localeCompare(b.planName, 'pt-BR');
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

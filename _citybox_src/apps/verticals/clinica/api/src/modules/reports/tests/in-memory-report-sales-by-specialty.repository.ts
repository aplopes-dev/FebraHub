import { ReportSalesBySpecialtyRepository } from '../domain/repositories/report-sales-by-specialty.repository';
import {
  REPORT_SALES_UNINFORMED_SPECIALTY,
  type ListReportSalesBySpecialtyCriteria,
  type ListReportSalesBySpecialtyResult,
  type ReportSalesBySpecialtyRow,
} from '../domain/report-sales-by-specialty.types';

type StoredSaleItem = {
  id: string;
  storeId: string;
  budgetStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt: string | null;
  budgetDate: string;
  specialtyName: string | null;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

function resolveSaleDate(item: StoredSaleItem): string {
  return item.approvedAt ?? item.budgetDate;
}

export class InMemoryReportSalesBySpecialtyRepository extends ReportSalesBySpecialtyRepository {
  private readonly items: StoredSaleItem[] = [];

  seed(items: readonly StoredSaleItem[]): void {
    this.items.splice(0, this.items.length, ...items);
  }

  async findMany(
    storeId: string,
    criteria: ListReportSalesBySpecialtyCriteria,
  ): Promise<ListReportSalesBySpecialtyResult> {
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
        (item): ReportSalesBySpecialtyRow => ({
          id: item.id,
          specialtyName:
            item.specialtyName?.trim() || REPORT_SALES_UNINFORMED_SPECIALTY,
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
        if (a.specialtyName !== b.specialtyName) {
          return a.specialtyName.localeCompare(b.specialtyName, 'pt-BR');
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

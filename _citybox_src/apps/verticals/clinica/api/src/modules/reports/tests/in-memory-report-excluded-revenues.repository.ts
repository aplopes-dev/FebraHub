import { ReportExcludedRevenuesRepository } from '../domain/repositories/report-excluded-revenues.repository';
import {
  REPORT_EXCLUDED_REVENUE_NO_PATIENT,
  REPORT_EXCLUDED_REVENUE_UNINFORMED_BY,
  type ListReportExcludedRevenuesCriteria,
  type ListReportExcludedRevenuesResult,
  type ReportExcludedRevenueRow,
} from '../domain/report-excluded-revenues.types';

type StoredEntry = {
  id: string;
  storeId: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'received' | 'cancelled';
  updatedAt: string;
  patientName: string | null;
  description: string;
  valueCents: number;
  paidValueCents: number | null;
  cancelledByName?: string | null;
};

export class InMemoryReportExcludedRevenuesRepository extends ReportExcludedRevenuesRepository {
  private readonly entries: StoredEntry[] = [];

  seed(entries: readonly StoredEntry[]): void {
    this.entries.splice(0, this.entries.length, ...entries);
  }

  async findMany(
    storeId: string,
    criteria: ListReportExcludedRevenuesCriteria,
  ): Promise<ListReportExcludedRevenuesResult> {
    const matched = this.entries
      .filter((item) => item.storeId === storeId)
      .filter((item) => item.type === 'income')
      .filter((item) => item.status === 'cancelled')
      .filter((item) => {
        const day = item.updatedAt.slice(0, 10);
        return day >= criteria.startDate && day <= criteria.endDate;
      })
      .map(
        (item): ReportExcludedRevenueRow => ({
          id: item.id,
          patientName: item.patientName?.trim() || REPORT_EXCLUDED_REVENUE_NO_PATIENT,
          description: item.description,
          valueCents: item.paidValueCents ?? item.valueCents,
          excludedAt: item.updatedAt.slice(0, 10),
          excludedBy:
            item.cancelledByName?.trim() || REPORT_EXCLUDED_REVENUE_UNINFORMED_BY,
        }),
      )
      .sort((a, b) => {
        if (a.excludedAt !== b.excludedAt) {
          return b.excludedAt.localeCompare(a.excludedAt);
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

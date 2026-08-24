import type {
  ListReportExcludedRevenuesCriteria,
  ListReportExcludedRevenuesResult,
} from '../report-excluded-revenues.types';

export abstract class ReportExcludedRevenuesRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportExcludedRevenuesCriteria,
  ): Promise<ListReportExcludedRevenuesResult>;
}

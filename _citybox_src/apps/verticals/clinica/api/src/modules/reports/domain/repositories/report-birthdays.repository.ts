import type {
  ListReportBirthdaysCriteria,
  ListReportBirthdaysResult,
} from '../report-birthday.types';

export abstract class ReportBirthdaysRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportBirthdaysCriteria,
  ): Promise<ListReportBirthdaysResult>;
}

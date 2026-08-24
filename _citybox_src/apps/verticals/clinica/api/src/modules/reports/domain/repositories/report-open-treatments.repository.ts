import type {
  ListReportOpenTreatmentsCriteria,
  ListReportOpenTreatmentsResult,
} from '../report-open-treatments.types';

export abstract class ReportOpenTreatmentsRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportOpenTreatmentsCriteria,
  ): Promise<ListReportOpenTreatmentsResult>;
}

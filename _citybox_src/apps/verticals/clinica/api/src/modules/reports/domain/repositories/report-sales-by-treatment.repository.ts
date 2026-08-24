import type {
  ListReportSalesByTreatmentCriteria,
  ListReportSalesByTreatmentResult,
} from '../report-sales-by-treatment.types';

export abstract class ReportSalesByTreatmentRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportSalesByTreatmentCriteria,
  ): Promise<ListReportSalesByTreatmentResult>;
}

import type {
  ListReportSalesBySpecialtyCriteria,
  ListReportSalesBySpecialtyResult,
} from '../report-sales-by-specialty.types';

export abstract class ReportSalesBySpecialtyRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportSalesBySpecialtyCriteria,
  ): Promise<ListReportSalesBySpecialtyResult>;
}

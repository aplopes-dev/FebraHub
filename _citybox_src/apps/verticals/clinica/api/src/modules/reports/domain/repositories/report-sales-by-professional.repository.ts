import type {
  ListReportSalesByProfessionalCriteria,
  ListReportSalesByProfessionalResult,
} from '../report-sales-by-professional.types';

export abstract class ReportSalesByProfessionalRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportSalesByProfessionalCriteria,
  ): Promise<ListReportSalesByProfessionalResult>;
}

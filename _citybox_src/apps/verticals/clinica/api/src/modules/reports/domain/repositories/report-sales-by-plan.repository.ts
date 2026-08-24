import type {
  ListReportSalesByPlanCriteria,
  ListReportSalesByPlanResult,
} from '../report-sales-by-plan.types';

export abstract class ReportSalesByPlanRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportSalesByPlanCriteria,
  ): Promise<ListReportSalesByPlanResult>;
}

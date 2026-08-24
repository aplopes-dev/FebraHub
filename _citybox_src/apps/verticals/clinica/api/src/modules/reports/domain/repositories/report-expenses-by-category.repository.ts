import type {
  ListReportExpensesByCategoryCriteria,
  ListReportExpensesByCategoryResult,
} from '../report-expenses-by-category.types';

export abstract class ReportExpensesByCategoryRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportExpensesByCategoryCriteria,
  ): Promise<ListReportExpensesByCategoryResult>;
}

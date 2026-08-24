import type {
  ListReportRejectedBudgetsCriteria,
  ListReportRejectedBudgetsResult,
} from '../report-rejected-budgets.types';

export abstract class ReportRejectedBudgetsRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportRejectedBudgetsCriteria,
  ): Promise<ListReportRejectedBudgetsResult>;
}

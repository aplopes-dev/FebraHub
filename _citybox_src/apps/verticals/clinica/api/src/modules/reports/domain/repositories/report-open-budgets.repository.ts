import type {
  ListReportOpenBudgetsCriteria,
  ListReportOpenBudgetsResult,
} from '../report-open-budgets.types';

export abstract class ReportOpenBudgetsRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportOpenBudgetsCriteria,
  ): Promise<ListReportOpenBudgetsResult>;
}

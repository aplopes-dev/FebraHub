import type {
  ListReportApprovedBudgetsCriteria,
  ListReportApprovedBudgetsResult,
} from '../report-approved-budgets.types';

export abstract class ReportApprovedBudgetsRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportApprovedBudgetsCriteria,
  ): Promise<ListReportApprovedBudgetsResult>;
}

import { ReportOpenBudgetsRepository } from '../domain/repositories/report-open-budgets.repository';
import type {
  ListReportOpenBudgetsCriteria,
  ListReportOpenBudgetsResult,
  ReportOpenBudgetRow,
} from '../domain/report-open-budgets.types';

type StoredBudget = {
  id: string;
  storeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  date: string;
  description: string;
  finalValueCents: number;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
};

export class InMemoryReportOpenBudgetsRepository extends ReportOpenBudgetsRepository {
  private readonly budgets: StoredBudget[] = [];

  seed(budgets: readonly StoredBudget[]): void {
    this.budgets.splice(0, this.budgets.length, ...budgets);
  }

  async findMany(
    storeId: string,
    criteria: ListReportOpenBudgetsCriteria,
  ): Promise<ListReportOpenBudgetsResult> {
    const matched = this.budgets
      .filter((budget) => budget.storeId === storeId)
      .filter((budget) => budget.status === 'pending')
      .filter(
        (budget) =>
          budget.date >= criteria.startDate && budget.date <= criteria.endDate,
      )
      .map(
        (budget): ReportOpenBudgetRow => ({
          id: budget.id,
          budgetDate: budget.date,
          patientName: budget.patientName,
          document: budget.document,
          mobile: budget.mobile,
          email: budget.email,
          responsibleMobile: budget.responsibleMobile,
          description: budget.description,
          status: 'pending',
          valueCents: budget.finalValueCents,
        }),
      )
      .sort((a, b) => {
        if (a.budgetDate === b.budgetDate) {
          return b.id.localeCompare(a.id);
        }
        return b.budgetDate.localeCompare(a.budgetDate);
      });

    const total = matched.length;
    const items = matched.slice(criteria.skip, criteria.skip + criteria.take);
    return { items, total };
  }
}

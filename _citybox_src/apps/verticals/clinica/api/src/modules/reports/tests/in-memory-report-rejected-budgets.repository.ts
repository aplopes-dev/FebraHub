import { ReportRejectedBudgetsRepository } from '../domain/repositories/report-rejected-budgets.repository';
import type {
  ListReportRejectedBudgetsCriteria,
  ListReportRejectedBudgetsResult,
  ReportRejectedBudgetRow,
} from '../domain/report-rejected-budgets.types';

type StoredBudget = {
  id: string;
  storeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejectedAt: string | null;
  date: string;
  description: string;
  finalValueCents: number;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
};

export class InMemoryReportRejectedBudgetsRepository extends ReportRejectedBudgetsRepository {
  private readonly budgets: StoredBudget[] = [];

  seed(budgets: readonly StoredBudget[]): void {
    this.budgets.splice(0, this.budgets.length, ...budgets);
  }

  async findMany(
    storeId: string,
    criteria: ListReportRejectedBudgetsCriteria,
  ): Promise<ListReportRejectedBudgetsResult> {
    const matched = this.budgets
      .filter((budget) => budget.storeId === storeId)
      .filter((budget) => budget.status === 'rejected')
      .filter((budget) => {
        if (budget.rejectedAt !== null) {
          return (
            budget.rejectedAt >= criteria.startDate &&
            budget.rejectedAt <= criteria.endDate
          );
        }
        return (
          budget.date >= criteria.startDate && budget.date <= criteria.endDate
        );
      })
      .map(
        (budget): ReportRejectedBudgetRow => ({
          id: budget.id,
          budgetDate: budget.date,
          patientName: budget.patientName,
          document: budget.document,
          mobile: budget.mobile,
          email: budget.email,
          responsibleMobile: budget.responsibleMobile,
          description: budget.description,
          status: 'rejected',
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

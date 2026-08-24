import { ReportApprovedBudgetsRepository } from '../domain/repositories/report-approved-budgets.repository';
import type {
  ListReportApprovedBudgetsCriteria,
  ListReportApprovedBudgetsResult,
  ReportApprovedBudgetRow,
} from '../domain/report-approved-budgets.types';
import { parseCivilDate } from '../domain/utils/birthday-civil-range';

type StoredBudget = {
  id: string;
  storeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt: Date | null;
  date: string;
  description: string;
  finalValueCents: number;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
};

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

export class InMemoryReportApprovedBudgetsRepository extends ReportApprovedBudgetsRepository {
  private readonly budgets: StoredBudget[] = [];

  seed(budgets: readonly StoredBudget[]): void {
    this.budgets.splice(0, this.budgets.length, ...budgets);
  }

  async findMany(
    storeId: string,
    criteria: ListReportApprovedBudgetsCriteria,
  ): Promise<ListReportApprovedBudgetsResult> {
    const rangeStart = parseCivilDate(criteria.startDate);
    const rangeEnd = toInclusiveEnd(criteria.endDate);

    const matched = this.budgets
      .filter((budget) => budget.storeId === storeId)
      .filter((budget) => budget.status === 'approved')
      .filter((budget) => budget.approvedAt !== null)
      .filter((budget) => {
        const approvedAt = budget.approvedAt!;
        return (
          approvedAt.getTime() >= rangeStart.getTime() &&
          approvedAt.getTime() <= rangeEnd.getTime()
        );
      })
      .map(
        (budget): ReportApprovedBudgetRow => ({
          id: budget.id,
          budgetDate: budget.date,
          patientName: budget.patientName,
          document: budget.document,
          mobile: budget.mobile,
          email: budget.email,
          responsibleMobile: budget.responsibleMobile,
          description: budget.description,
          status: 'approved',
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

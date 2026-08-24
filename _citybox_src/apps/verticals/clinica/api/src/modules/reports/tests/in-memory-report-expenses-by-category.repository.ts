import { buildExpenseByCategorySummary } from '../../dashboard/application/utils/dashboard-expense-by-category.math';
import type { ExpenseByCategoryAggRow } from '../../dashboard/application/utils/dashboard-expense-by-category.types';
import { ReportExpensesByCategoryRepository } from '../domain/repositories/report-expenses-by-category.repository';
import type {
  ListReportExpensesByCategoryCriteria,
  ListReportExpensesByCategoryResult,
  ReportExpensesByCategoryRow,
} from '../domain/report-expenses-by-category.types';

type StoredExpense = {
  storeId: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'received' | 'cancelled';
  paidAt: string | null;
  expenseCategoryId: string | null;
  expenseCategoryName: string | null;
  amountCents: number;
};

function aggregateAndPage(
  rows: readonly ExpenseByCategoryAggRow[],
  criteria: ListReportExpensesByCategoryCriteria,
): ListReportExpensesByCategoryResult {
  const summary = buildExpenseByCategorySummary(rows);
  const items: ReportExpensesByCategoryRow[] = summary.items
    .map((item) => ({
      id: item.categoryId,
      categoryName: item.label,
      valueCents: item.amountCents,
      percentage: item.percent,
    }))
    .sort((a, b) => {
      if (a.valueCents !== b.valueCents) {
        return b.valueCents - a.valueCents;
      }
      return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
    });

  const total = items.length;
  const pageItems = items.slice(criteria.skip, criteria.skip + criteria.take);
  return { items: pageItems, total };
}

export class InMemoryReportExpensesByCategoryRepository extends ReportExpensesByCategoryRepository {
  private readonly expenses: StoredExpense[] = [];

  seed(expenses: readonly StoredExpense[]): void {
    this.expenses.splice(0, this.expenses.length, ...expenses);
  }

  async findMany(
    storeId: string,
    criteria: ListReportExpensesByCategoryCriteria,
  ): Promise<ListReportExpensesByCategoryResult> {
    const rows: ExpenseByCategoryAggRow[] = this.expenses
      .filter((item) => item.storeId === storeId)
      .filter((item) => item.type === 'expense')
      .filter((item) => item.status === 'paid')
      .filter((item) => {
        if (item.paidAt === null) return false;
        return (
          item.paidAt >= criteria.startDate && item.paidAt <= criteria.endDate
        );
      })
      .map((item) => ({
        categoryId: item.expenseCategoryId,
        categoryName: item.expenseCategoryName,
        categoryColor: null,
        amountCents: item.amountCents,
      }));

    return aggregateAndPage(rows, criteria);
  }
}

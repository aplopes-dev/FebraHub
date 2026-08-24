export type DashboardExpenseByCategoryPeriodMode = 'annual' | 'monthly';

export const EXPENSE_BY_CATEGORY_UNCATEGORIZED_ID = 'uncategorized';
export const EXPENSE_BY_CATEGORY_UNCATEGORIZED_LABEL = 'Sem categoria';
export const EXPENSE_BY_CATEGORY_UNCATEGORIZED_COLOR = '#94a3b8';

export type ExpenseByCategoryAggRow = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  amountCents: number;
};

export type DashboardExpenseByCategoryItem = {
  categoryId: string;
  label: string;
  color: string;
  amountCents: number;
  percent: number;
};

export type DashboardExpenseByCategorySummary = {
  totalCents: number;
  items: DashboardExpenseByCategoryItem[];
};

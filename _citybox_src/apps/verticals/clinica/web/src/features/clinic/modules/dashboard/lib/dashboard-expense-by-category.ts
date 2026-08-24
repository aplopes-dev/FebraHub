import type {
  DashboardExpenseByCategoryEntry,
  DashboardExpenseByCategorySummary,
  DashboardExpenseCategorySummaryItem,
  ExpenseByCategoryPeriodMode,
} from '../types/clinic-dashboard';
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_LABELS,
} from '../data/mock-dashboard-expense-by-category';
import { buildFinancialPeriodKey } from './dashboard-financial';

export const EXPENSE_BY_CATEGORY_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

const CATEGORY_ORDER = [
  'exp-cat-labs',
  'exp-cat-fixed',
  'exp-cat-commissions',
] as const;

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function filterExpenseByCategoryEntries(
  entries: readonly DashboardExpenseByCategoryEntry[],
  input: {
    mode: ExpenseByCategoryPeriodMode;
    year: number;
    month: number;
  },
): DashboardExpenseByCategoryEntry[] {
  const { mode, year, month } = input;
  if (mode === 'annual') {
    const prefix = String(year);
    return entries.filter((entry) => entry.date.startsWith(prefix));
  }
  const prefix = buildFinancialPeriodKey(year, month);
  return entries.filter((entry) => entry.date.startsWith(prefix));
}

export function summarizeExpenseByCategory(
  entries: readonly DashboardExpenseByCategoryEntry[],
): DashboardExpenseByCategorySummary {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    totals.set(
      entry.categoryId,
      (totals.get(entry.categoryId) ?? 0) + entry.amountCents,
    );
  }

  let totalCents = 0;
  for (const amount of totals.values()) {
    totalCents += amount;
  }

  const items: DashboardExpenseCategorySummaryItem[] = CATEGORY_ORDER.map(
    (categoryId) => {
      const amountCents = totals.get(categoryId) ?? 0;
      const percent =
        totalCents <= 0 ? 0 : roundPercent((amountCents / totalCents) * 100);
      return {
        categoryId,
        label: EXPENSE_CATEGORY_LABELS[categoryId],
        color: EXPENSE_CATEGORY_COLORS[categoryId],
        amountCents,
        percent,
      };
    },
  )
    .filter((item) => item.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);

  // Ajusta último % para fechar 100 quando houver arredondamento.
  if (items.length > 0 && totalCents > 0) {
    const sumExceptLast = items
      .slice(0, -1)
      .reduce((acc, item) => acc + item.percent, 0);
    const last = items[items.length - 1]!;
    items[items.length - 1] = {
      ...last,
      percent: roundPercent(Math.max(0, 100 - sumExceptLast)),
    };
  }

  return { totalCents, items };
}

export function getExpenseByCategoryYears(
  entries: readonly DashboardExpenseByCategoryEntry[],
): number[] {
  return [
    ...new Set(entries.map((entry) => Number(entry.date.slice(0, 4)))),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

/** Intervalo `yyyy-MM-dd` para deep-link do fluxo de caixa. */
export function resolveExpenseByCategoryPeriodRange(input: {
  mode: ExpenseByCategoryPeriodMode;
  year: number;
  month: number;
}): { startDate: string; endDate: string } {
  if (input.mode === 'annual') {
    return {
      startDate: `${input.year}-01-01`,
      endDate: `${input.year}-12-31`,
    };
  }
  const lastDay = new Date(input.year, input.month, 0).getDate();
  const monthPad = String(input.month).padStart(2, '0');
  return {
    startDate: `${input.year}-${monthPad}-01`,
    endDate: `${input.year}-${monthPad}-${String(lastDay).padStart(2, '0')}`,
  };
}

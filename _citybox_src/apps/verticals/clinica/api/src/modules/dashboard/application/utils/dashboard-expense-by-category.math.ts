import { civilDayEndUtc, civilDayStartUtc } from './dashboard-patients.dates';
import type {
  DashboardExpenseByCategoryItem,
  DashboardExpenseByCategoryPeriodMode,
  DashboardExpenseByCategorySummary,
  ExpenseByCategoryAggRow,
} from './dashboard-expense-by-category.types';
import {
  EXPENSE_BY_CATEGORY_UNCATEGORIZED_COLOR,
  EXPENSE_BY_CATEGORY_UNCATEGORIZED_ID,
  EXPENSE_BY_CATEGORY_UNCATEGORIZED_LABEL,
} from './dashboard-expense-by-category.types';

export function resolveExpenseByCategoryPeriodRange(input: {
  periodMode: DashboardExpenseByCategoryPeriodMode;
  year: number;
  month?: number;
}): { startIsoDate: string; endIsoDate: string; startAt: Date; endAt: Date } {
  const { periodMode, year, month } = input;
  let startIsoDate: string;
  let endIsoDate: string;

  if (periodMode === 'annual') {
    startIsoDate = `${year}-01-01`;
    endIsoDate = `${year}-12-31`;
  } else {
    if (month == null || month < 1 || month > 12) {
      throw new Error('month is required for monthly periodMode');
    }
    const padded = String(month).padStart(2, '0');
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    startIsoDate = `${year}-${padded}-01`;
    endIsoDate = `${year}-${padded}-${String(days).padStart(2, '0')}`;
  }

  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildExpenseByCategorySummary(
  rows: readonly ExpenseByCategoryAggRow[],
): DashboardExpenseByCategorySummary {
  const byCategory = new Map<
    string,
    { label: string; color: string; amountCents: number }
  >();

  for (const row of rows) {
    if (row.amountCents <= 0) continue;
    const categoryId = row.categoryId ?? EXPENSE_BY_CATEGORY_UNCATEGORIZED_ID;
    const label =
      row.categoryName?.trim() || EXPENSE_BY_CATEGORY_UNCATEGORIZED_LABEL;
    const color =
      row.categoryColor?.trim() || EXPENSE_BY_CATEGORY_UNCATEGORIZED_COLOR;
    const existing = byCategory.get(categoryId);
    if (existing) {
      byCategory.set(categoryId, {
        ...existing,
        amountCents: existing.amountCents + row.amountCents,
      });
    } else {
      byCategory.set(categoryId, {
        label,
        color,
        amountCents: row.amountCents,
      });
    }
  }

  let totalCents = 0;
  for (const item of byCategory.values()) {
    totalCents += item.amountCents;
  }

  const items: DashboardExpenseByCategoryItem[] = [...byCategory.entries()]
    .map(([categoryId, item]) => ({
      categoryId,
      label: item.label,
      color: item.color,
      amountCents: item.amountCents,
      percent:
        totalCents <= 0
          ? 0
          : roundPercent((item.amountCents / totalCents) * 100),
    }))
    .filter((item) => item.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);

  if (items.length > 0 && totalCents > 0) {
    const sumExceptLast = items
      .slice(0, -1)
      .reduce((acc, item) => acc + item.percent, 0);
    const last = items[items.length - 1];
    items[items.length - 1] = {
      ...last,
      percent: roundPercent(Math.max(0, 100 - sumExceptLast)),
    };
  }

  return { totalCents, items };
}

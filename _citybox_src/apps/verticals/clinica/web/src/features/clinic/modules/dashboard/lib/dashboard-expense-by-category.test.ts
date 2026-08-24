import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_EXPENSE_BY_CATEGORY } from '../data/mock-dashboard-expense-by-category';
import {
  filterExpenseByCategoryEntries,
  getExpenseByCategoryYears,
  resolveExpenseByCategoryPeriodRange,
  summarizeExpenseByCategory,
} from './dashboard-expense-by-category';

describe('dashboard-expense-by-category', () => {
  it('filters monthly entries and aggregates like the example ratios', () => {
    const filtered = filterExpenseByCategoryEntries(
      MOCK_DASHBOARD_EXPENSE_BY_CATEGORY,
      { mode: 'monthly', year: 2026, month: 7 },
    );
    const summary = summarizeExpenseByCategory(filtered);

    expect(summary.totalCents).toBe(800_000 + 650_000 + 560_000 + 350_898);
    expect(summary.items).toHaveLength(3);
    expect(summary.items[0]!.label).toBe('Laboratórios');
    expect(summary.items[0]!.amountCents).toBe(1_450_000);
    expect(summary.items[0]!.percent).toBe(61.4);
    expect(summary.items[1]!.label).toContain('Custos Fixos');
    expect(summary.items[1]!.amountCents).toBe(560_000);
    expect(summary.items[2]!.label).toBe('Comissões');
    expect(summary.items[2]!.amountCents).toBe(350_898);

    const percentSum = summary.items.reduce((acc, item) => acc + item.percent, 0);
    expect(percentSum).toBe(100);
  });

  it('filters by annual year', () => {
    const filtered = filterExpenseByCategoryEntries(
      MOCK_DASHBOARD_EXPENSE_BY_CATEGORY,
      { mode: 'annual', year: 2025, month: 7 },
    );
    expect(filtered.map((e) => e.id).sort()).toEqual(['exp-008', 'exp-009']);
  });

  it('lists years descending', () => {
    expect(getExpenseByCategoryYears(MOCK_DASHBOARD_EXPENSE_BY_CATEGORY)).toEqual([
      2026, 2025,
    ]);
  });

  it('resolves custom period range for month and year', () => {
    expect(
      resolveExpenseByCategoryPeriodRange({
        mode: 'monthly',
        year: 2026,
        month: 7,
      }),
    ).toEqual({ startDate: '2026-07-01', endDate: '2026-07-31' });
    expect(
      resolveExpenseByCategoryPeriodRange({
        mode: 'annual',
        year: 2026,
        month: 7,
      }),
    ).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
  });
});

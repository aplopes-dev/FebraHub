import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_BUDGET_ANALYSIS } from '../data/mock-dashboard-budget-analysis';
import {
  aggregateDashboardBudgets,
  buildBudgetStatusTimelineChart,
  filterDashboardBudgets,
  summarizeDashboardBudgetStatus,
} from './budget-analysis';

describe('budget-analysis', () => {
  it('filters annual budgets by year and professional', () => {
    const result = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'annual',
      year: 2026,
      professionalId: 'pro-dr-carlos',
    });

    expect(result).toHaveLength(4);
    expect(
      result.every((budget) => budget.professionalId === 'pro-dr-carlos'),
    ).toBe(true);
  });

  it('filters monthly budgets and status', () => {
    const result = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      status: 'approved',
    });

    expect(result.map((budget) => budget.id)).toEqual([
      'analysis-budget-007',
    ]);
  });

  it('summarizes three statuses and approval rate over total', () => {
    const budgets = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    const summary = summarizeDashboardBudgetStatus(budgets);

    expect(summary.approved.count).toBe(1);
    expect(summary.open.count).toBe(1);
    expect(summary.rejected.count).toBe(1);
    expect(summary.approvalRate).toBeCloseTo(33.33, 1);
  });

  it('returns zero approval for an empty collection', () => {
    expect(summarizeDashboardBudgetStatus([]).approvalRate).toBe(0);
  });

  it('aggregates approved budgets by professional', () => {
    const budgets = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'annual',
      year: 2026,
      status: 'approved',
    });
    const aggregates = aggregateDashboardBudgets(budgets, 'professionals');

    expect(aggregates[0]).toMatchObject({
      key: 'pro-dra-sofia',
      name: 'Dra. Sofia Lima',
      count: 1,
      totalCents: 150000,
    });
    expect(aggregates).toHaveLength(3);
  });

  it('aggregates by plans and treatments', () => {
    const budgets = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'annual',
      year: 2026,
      status: 'approved',
    });

    expect(aggregateDashboardBudgets(budgets, 'plans')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'plan-preventivo', count: 2 }),
      ]),
    );
    expect(aggregateDashboardBudgets(budgets, 'treatments')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'trt-limpeza', count: 1 }),
      ]),
    );
  });

  it('builds annual timeline with abbreviated months', () => {
    const budgets = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'annual',
      year: 2026,
    });
    const chart = buildBudgetStatusTimelineChart({
      budgets,
      periodMode: 'annual',
      year: 2026,
      metric: 'quantity',
    });

    expect(chart).toHaveLength(12);
    expect(chart.map((point) => point.label)).toEqual([
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]);
    expect(chart[0]).toMatchObject({ approved: 1, rejected: 0, open: 0 });
    expect(chart[6]).toMatchObject({ approved: 1, rejected: 1, open: 1 });
  });

  it('builds monthly timeline with every day of the month', () => {
    const budgets = filterDashboardBudgets({
      budgets: MOCK_DASHBOARD_BUDGET_ANALYSIS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    const chart = buildBudgetStatusTimelineChart({
      budgets,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      metric: 'quantity',
    });

    expect(chart).toHaveLength(31);
    expect(chart[0]?.label).toBe('1');
    expect(chart[30]?.label).toBe('31');
    expect(chart.find((point) => point.key === '2026-07-03')).toMatchObject({
      approved: 1,
      rejected: 0,
      open: 0,
    });
  });
});

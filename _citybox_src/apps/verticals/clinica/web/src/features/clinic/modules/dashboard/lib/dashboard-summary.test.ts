import { describe, expect, it } from 'vitest';
import {
  MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
  MOCK_DASHBOARD_BUDGETS,
  MOCK_DASHBOARD_OVERDUE_INCOMES,
} from '../data/mock-clinic-dashboard';
import { buildDashboardSummary } from './dashboard-summary';

describe('buildDashboardSummary', () => {
  const referenceDate = new Date(2026, 6, 17);

  it('sums overdue incomes in cents', () => {
    const summary = buildDashboardSummary({
      overdueIncomes: MOCK_DASHBOARD_OVERDUE_INCOMES,
      budgets: [],
      birthdayPatients: [],
      referenceDate,
    });

    expect(summary.overdueIncomeTotalCents).toBe(150000 + 28000 + 80000 + 22000);
  });

  it('sums open and rejected budgets', () => {
    const summary = buildDashboardSummary({
      overdueIncomes: [],
      budgets: MOCK_DASHBOARD_BUDGETS,
      birthdayPatients: [],
      referenceDate,
    });

    expect(summary.openRejectedBudgetsTotalCents).toBe(
      MOCK_DASHBOARD_BUDGETS.reduce((sum, b) => sum + b.valueCents, 0),
    );
  });

  it('counts active birthdays in the next 30 days', () => {
    const summary = buildDashboardSummary({
      overdueIncomes: [],
      budgets: [],
      birthdayPatients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      referenceDate,
    });

    // Ana (hoje), Isabela (+1), Daniel (+3), Bruno (+8), Henrique (+28); Camila inactive excluded; Elena (+62) out
    expect(summary.upcomingBirthdaysCount).toBe(5);
  });
});

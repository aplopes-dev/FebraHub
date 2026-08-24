import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_FINANCIAL_BY_PERIOD } from '../data/mock-dashboard-financial';
import {
  buildFinancialPeriodKey,
  calculateFinancialProgress,
  resolveDashboardFinancialSummary,
  resolveFinancialMonthDateRange,
} from './dashboard-financial';

describe('dashboard-financial', () => {
  it('builds a zero-padded period key', () => {
    expect(buildFinancialPeriodKey(2026, 7)).toBe('2026-07');
  });

  it('resolves civil month date range as yyyy-MM-dd', () => {
    expect(resolveFinancialMonthDateRange(2026, 7)).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(resolveFinancialMonthDateRange(2026, 2)).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
  });

  it('resolves the selected month summary', () => {
    expect(
      resolveDashboardFinancialSummary(
        MOCK_DASHBOARD_FINANCIAL_BY_PERIOD,
        2026,
        7,
      ).income.receivedCents,
    ).toBe(4865000);
  });

  it('returns immutable zeros when period has no fixture', () => {
    const result = resolveDashboardFinancialSummary(
      MOCK_DASHBOARD_FINANCIAL_BY_PERIOD,
      2024,
      1,
    );
    expect(result.balance.currentCents).toBe(0);
    expect(result.income.totalCents).toBe(0);
  });

  it('calculates a bounded progress percentage', () => {
    expect(calculateFinancialProgress(50, 100)).toBe(50);
    expect(calculateFinancialProgress(150, 100)).toBe(100);
    expect(calculateFinancialProgress(10, 0)).toBe(0);
  });
});

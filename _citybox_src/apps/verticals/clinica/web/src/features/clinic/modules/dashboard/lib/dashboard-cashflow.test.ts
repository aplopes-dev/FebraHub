import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_CASHFLOW } from '../data/mock-dashboard-cashflow';
import {
  buildCashflowReport,
  classifyCashflowEntry,
  getCashflowYears,
} from './dashboard-cashflow';

const TODAY = new Date(2026, 6, 20); // 2026-07-20

describe('dashboard-cashflow', () => {
  it('classifies paid, forecast and excluded entries', () => {
    expect(
      classifyCashflowEntry(
        {
          id: '1',
          side: 'income',
          dueDate: '2026-07-10',
          paidAt: '2026-07-10',
          valueCents: 100,
        },
        '2026-07-20',
      ),
    ).toBe('paid');
    expect(
      classifyCashflowEntry(
        {
          id: '2',
          side: 'income',
          dueDate: '2026-07-25',
          paidAt: null,
          valueCents: 100,
        },
        '2026-07-20',
      ),
    ).toBe('forecast');
    expect(
      classifyCashflowEntry(
        {
          id: '3',
          side: 'income',
          dueDate: '2026-07-01',
          paidAt: null,
          valueCents: 100,
        },
        '2026-07-20',
      ),
    ).toBe('excluded');
    expect(
      classifyCashflowEntry(
        {
          id: '4',
          side: 'income',
          dueDate: '2026-07-15',
          paidAt: '2026-07-25',
          valueCents: 100,
        },
        '2026-07-20',
      ),
    ).toBe('excluded');
  });

  it('builds monthly report excluding overdue and future payments', () => {
    const { totals, timeline } = buildCashflowReport({
      entries: MOCK_DASHBOARD_CASHFLOW,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      today: TODAY,
    });

    expect(timeline).toHaveLength(31);
    expect(totals.incomeCents).toBeGreaterThan(0);
    expect(totals.expenseCents).toBeGreaterThan(0);
    expect(totals.balanceCents).toBe(
      totals.incomeCents - totals.expenseCents,
    );

    // Overdue income 500_000 and future payment 300_000 must not be included
    const julyIncomePaid = timeline.reduce(
      (sum, point) => sum + point.incomePaid,
      0,
    );
    expect(julyIncomePaid).toBeCloseTo(63_900, 0); // 12500+8900+14500+7200+9800+11000 reais from paid
  });

  it('builds annual timeline with 12 months', () => {
    const { timeline } = buildCashflowReport({
      entries: MOCK_DASHBOARD_CASHFLOW,
      periodMode: 'annual',
      year: 2026,
      today: TODAY,
    });
    expect(timeline).toHaveLength(12);
    expect(timeline[0]?.label).toBe('Jan');
    expect(timeline.some((point) => point.incomePaid > 0)).toBe(true);
    expect(timeline.some((point) => point.incomeForecast > 0)).toBe(true);
  });

  it('lists years descending', () => {
    expect(getCashflowYears(MOCK_DASHBOARD_CASHFLOW)).toEqual([2026, 2025]);
  });
});

import type { DashboardFinancialSummaryByPeriod } from '../types/clinic-dashboard';

/** Fixture de testes unitários do card Financeiro; produção usa `GET /v1/financial/entries/stats`. */
export const MOCK_DASHBOARD_FINANCIAL_BY_PERIOD: DashboardFinancialSummaryByPeriod =
  {
    '2026-07': {
      income: {
        receivedCents: 4865000,
        toReceiveCents: 1735000,
        totalCents: 6600000,
      },
      expense: {
        paidCents: 2540000,
        toPayCents: 810000,
        totalCents: 3350000,
      },
      balance: {
        currentCents: 2325000,
        projectedCents: 3250000,
      },
    },
    '2026-06': {
      income: {
        receivedCents: 5210000,
        toReceiveCents: 1190000,
        totalCents: 6400000,
      },
      expense: {
        paidCents: 2780000,
        toPayCents: 620000,
        totalCents: 3400000,
      },
      balance: {
        currentCents: 2430000,
        projectedCents: 3000000,
      },
    },
    '2026-05': {
      income: {
        receivedCents: 4380000,
        toReceiveCents: 1420000,
        totalCents: 5800000,
      },
      expense: {
        paidCents: 2390000,
        toPayCents: 710000,
        totalCents: 3100000,
      },
      balance: {
        currentCents: 1990000,
        projectedCents: 2700000,
      },
    },
    '2025-12': {
      income: {
        receivedCents: 5960000,
        toReceiveCents: 940000,
        totalCents: 6900000,
      },
      expense: {
        paidCents: 3150000,
        toPayCents: 550000,
        totalCents: 3700000,
      },
      balance: {
        currentCents: 2810000,
        projectedCents: 3200000,
      },
    },
  };

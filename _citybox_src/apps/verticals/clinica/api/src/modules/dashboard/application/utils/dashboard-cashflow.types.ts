export type DashboardCashflowPeriodMode = 'annual' | 'monthly';

export type DashboardCashflowSide = 'income' | 'expense';

export type CashflowEntryRow = {
  id: string;
  type: DashboardCashflowSide;
  dueDate: Date;
  paidAt: Date | null;
  valueCents: number;
  paidValueCents: number | null;
};

export type DashboardCashflowTotals = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type DashboardCashflowTimelinePoint = {
  key: string;
  label: string;
  incomePaid: number;
  incomeForecast: number;
  expensePaid: number;
  expenseForecast: number;
  balance: number;
  balanceForecast: number;
};

export type ClassifiedCashflowBucket = 'paid' | 'forecast' | 'excluded';

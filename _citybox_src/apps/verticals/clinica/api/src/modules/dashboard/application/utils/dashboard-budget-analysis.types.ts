export type DashboardBudgetUiStatus = 'open' | 'approved' | 'rejected';

export type DashboardBudgetPeriodMode = 'annual' | 'monthly';

export type DashboardBudgetAnalysisDimension =
  | 'professionals'
  | 'plans'
  | 'treatments';

export type DashboardBudgetCountCents = {
  count: number;
  totalCents: number;
};

export type DashboardBudgetAnalysisRow = {
  id: string;
  budgetDate: string;
  patientId: string;
  patientName: string;
  description: string;
  status: DashboardBudgetUiStatus;
  valueCents: number;
  professionalId: string;
  professionalName: string;
  planId: string;
  planName: string;
  treatmentId: string;
  treatmentName: string;
};

export type DashboardBudgetTimelinePoint = {
  key: string;
  label: string;
  approved: DashboardBudgetCountCents;
  rejected: DashboardBudgetCountCents;
  open: DashboardBudgetCountCents;
};

export type DashboardBudgetAnalysisAggregate = {
  key: string;
  name: string;
  count: number;
  totalCents: number;
};

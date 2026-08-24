export type ReportOpenBudgetRow = {
  id: string;
  budgetDate: string;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
  description: string;
  status: 'pending';
  valueCents: number;
};

export type ListReportOpenBudgetsCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportOpenBudgetsResult = {
  items: ReportOpenBudgetRow[];
  total: number;
};

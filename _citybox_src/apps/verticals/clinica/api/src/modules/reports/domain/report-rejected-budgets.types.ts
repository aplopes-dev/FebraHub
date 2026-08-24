export type ReportRejectedBudgetRow = {
  id: string;
  budgetDate: string;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
  description: string;
  status: 'rejected';
  valueCents: number;
};

export type ListReportRejectedBudgetsCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportRejectedBudgetsResult = {
  items: ReportRejectedBudgetRow[];
  total: number;
};

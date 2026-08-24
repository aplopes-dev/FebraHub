export type ReportApprovedBudgetRow = {
  id: string;
  budgetDate: string;
  patientName: string;
  document: string;
  mobile: string;
  email: string;
  responsibleMobile: string;
  description: string;
  status: 'approved';
  valueCents: number;
};

export type ListReportApprovedBudgetsCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportApprovedBudgetsResult = {
  items: ReportApprovedBudgetRow[];
  total: number;
};

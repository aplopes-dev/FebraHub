export type ReportExcludedRevenueRow = {
  id: string;
  patientName: string;
  description: string;
  valueCents: number;
  excludedAt: string;
  excludedBy: string;
};

export type ListReportExcludedRevenuesCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportExcludedRevenuesResult = {
  items: ReportExcludedRevenueRow[];
  total: number;
};

export const REPORT_EXCLUDED_REVENUE_UNINFORMED_BY = 'Não informado';
export const REPORT_EXCLUDED_REVENUE_NO_PATIENT = '—';

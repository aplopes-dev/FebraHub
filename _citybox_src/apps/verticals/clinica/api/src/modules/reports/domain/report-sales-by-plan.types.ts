export type ReportSalesByPlanRow = {
  id: string;
  planName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ListReportSalesByPlanCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportSalesByPlanResult = {
  items: ReportSalesByPlanRow[];
  total: number;
};

export const REPORT_SALES_UNINFORMED_PLAN = 'Não informado';

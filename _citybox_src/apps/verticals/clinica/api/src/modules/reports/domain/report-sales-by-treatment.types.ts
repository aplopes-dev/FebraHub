export type ReportSalesByTreatmentRow = {
  id: string;
  treatmentName: string;
  saleDate: string;
  patientName: string;
  planName: string;
  valueCents: number;
};

export type ListReportSalesByTreatmentCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportSalesByTreatmentResult = {
  items: ReportSalesByTreatmentRow[];
  total: number;
};

export const REPORT_SALES_UNINFORMED_TREATMENT = 'Não informado';
export const REPORT_SALES_UNINFORMED_PLAN = 'Não informado';

export type ReportSalesByProfessionalRow = {
  id: string;
  professionalName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ListReportSalesByProfessionalCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportSalesByProfessionalResult = {
  items: ReportSalesByProfessionalRow[];
  total: number;
};

export const REPORT_SALES_UNINFORMED_PROFESSIONAL = 'Não informado';

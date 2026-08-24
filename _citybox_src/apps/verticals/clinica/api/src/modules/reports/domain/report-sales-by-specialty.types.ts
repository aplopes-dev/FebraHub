export type ReportSalesBySpecialtyRow = {
  id: string;
  specialtyName: string;
  saleDate: string;
  patientName: string;
  treatmentName: string;
  valueCents: number;
};

export type ListReportSalesBySpecialtyCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportSalesBySpecialtyResult = {
  items: ReportSalesBySpecialtyRow[];
  total: number;
};

export const REPORT_SALES_UNINFORMED_SPECIALTY = 'Não informado';

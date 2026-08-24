export type ReportReferredPatientRow = {
  id: string;
  referredPatientName: string;
  referredBy: string;
  referralDate: string;
  firstAppointmentDate: string | null;
  approvedBudgetsCount: number;
};

export type ListReportReferredPatientsCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
};

export type ListReportReferredPatientsResult = {
  items: ReportReferredPatientRow[];
  total: number;
};

export const REPORT_REFERRED_BY_UNINFORMED = 'Não informado';

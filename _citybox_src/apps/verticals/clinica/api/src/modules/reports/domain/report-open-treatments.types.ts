export type ReportOpenTreatmentsPatientStatus = 'active' | 'inactive';

export type ReportOpenTreatmentsWithoutAppointmentRow = {
  id: string;
  patientName: string;
  phone: string;
  mobile: string;
  document: string;
};

export type ListReportOpenTreatmentsCriteria = {
  skip: number;
  take: number;
  status: ReportOpenTreatmentsPatientStatus;
  now: Date;
};

export type ListReportOpenTreatmentsResult = {
  items: ReportOpenTreatmentsWithoutAppointmentRow[];
  total: number;
};

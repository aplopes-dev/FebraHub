export type ReportBirthdayPatientStatus = 'active' | 'inactive';

export type ReportBirthdayRow = {
  id: string;
  patientName: string;
  phone: string;
  birthDate: string;
  mobile: string;
};

export type ListReportBirthdaysCriteria = {
  startDate: string;
  endDate: string;
  skip: number;
  take: number;
  status: ReportBirthdayPatientStatus;
};

export type ListReportBirthdaysResult = {
  items: ReportBirthdayRow[];
  total: number;
};

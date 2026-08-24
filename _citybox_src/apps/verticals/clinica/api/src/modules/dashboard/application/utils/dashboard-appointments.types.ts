export type DashboardAppointmentsPeriodMode = 'annual' | 'monthly';

export type DashboardAppointmentOutcome =
  | 'finished'
  | 'missed'
  | 'cancelled_patient'
  | 'cancelled_pro';

export type DashboardAppointmentGroup = 'realized' | 'missed_cancelled';

export type AppointmentDashboardRow = {
  id: string;
  startAt: Date;
  status: DashboardAppointmentOutcome;
  categoryId: string | null;
  categoryName: string | null;
  patientId: string;
  patientName: string;
  phone: string;
  professionalId: string;
};

export type DashboardAppointmentsSummary = {
  realizedCount: number;
  missedCancelledCount: number;
  totalCount: number;
  attendanceRate: number;
};

export type DashboardAppointmentsTimelinePoint = {
  key: string;
  label: string;
  realized: number;
  missedCancelled: number;
};

export type DashboardAppointmentCategoryItem = {
  id: string;
  name: string;
  color: string;
};

export type DashboardAppointmentDetailItem = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  phone: string;
  categoryId: string | null;
  categoryName: string;
  status: DashboardAppointmentOutcome;
  professionalId: string;
};

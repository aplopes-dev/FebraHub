export type DashboardPatientMetricId =
  | 'total_registered'
  | 'seen_last_6_months'
  | 'overdue_debts'
  | 'new_seen_this_month'
  | 'open_treatment_without_appointment';

export const DASHBOARD_PATIENT_METRIC_IDS: DashboardPatientMetricId[] = [
  'total_registered',
  'seen_last_6_months',
  'overdue_debts',
  'new_seen_this_month',
  'open_treatment_without_appointment',
];

export function isDashboardPatientMetricId(
  value: string,
): value is DashboardPatientMetricId {
  return (DASHBOARD_PATIENT_METRIC_IDS as string[]).includes(value);
}

export type DashboardPatientListItem = {
  id: string;
  name: string;
  phone: string;
  landlinePhone: string;
  email: string;
  cpf: string | null;
  valueCents?: number;
};

export type DashboardPatientsSummary = {
  totalRegisteredCount: number;
  seenLast6MonthsCount: number;
  overdueDebtsPatientsCount: number;
  newSeenThisMonthCount: number;
  openTreatmentWithoutAppointmentCount: number;
};

export type DashboardPatientsListResult = {
  items: DashboardPatientListItem[];
  total: number;
};

export type DashboardPatientsListCriteria = {
  metric: DashboardPatientMetricId;
  skip: number;
  take: number;
  search?: string;
  now: Date;
};

/**
 * Query port for dashboard patient metrics (counts + paginated lists).
 */
export abstract class DashboardPatientsQuery {
  abstract getSummary(
    storeId: string,
    now: Date,
  ): Promise<DashboardPatientsSummary>;

  abstract listByMetric(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult>;
}

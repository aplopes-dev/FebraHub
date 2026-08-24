import type {
  DashboardPatientMetricId,
  DashboardPatientsListMetricId,
  DashboardPatientsSummary,
} from '../types/clinic-dashboard';

export type DashboardPatientMetricDefinition = {
  id: DashboardPatientMetricId;
  label: string;
};

/** Labels estáticos do card Pacientes (contagens vêm da API). */
export const DASHBOARD_PATIENT_METRIC_DEFINITIONS: DashboardPatientMetricDefinition[] =
  [
    {
      id: 'total_registered',
      label: 'Total de pacientes cadastrados',
    },
    {
      id: 'birthdays',
      label: 'Aniversariantes',
    },
    {
      id: 'seen_last_6_months',
      label: 'Pacientes atendidos nos últimos 6 meses',
    },
    {
      id: 'overdue_debts',
      label: 'Pacientes com débitos em atraso',
    },
    {
      id: 'new_seen_this_month',
      label: 'Novos pacientes atendidos no mês',
    },
    {
      id: 'open_treatment_without_appointment',
      label: 'Pacientes com procedimento em aberto sem consulta',
    },
  ];

export function isDashboardPatientsListMetricId(
  id: DashboardPatientMetricId,
): id is DashboardPatientsListMetricId {
  return id !== 'birthdays';
}

export function resolveDashboardPatientMetricCount(
  metricId: DashboardPatientMetricId,
  summary: DashboardPatientsSummary,
  upcomingBirthdaysCount: number,
): number {
  switch (metricId) {
    case 'total_registered':
      return summary.totalRegisteredCount;
    case 'birthdays':
      return upcomingBirthdaysCount;
    case 'seen_last_6_months':
      return summary.seenLast6MonthsCount;
    case 'overdue_debts':
      return summary.overdueDebtsPatientsCount;
    case 'new_seen_this_month':
      return summary.newSeenThisMonthCount;
    case 'open_treatment_without_appointment':
      return summary.openTreatmentWithoutAppointmentCount;
    default: {
      const _exhaustive: never = metricId;
      return _exhaustive;
    }
  }
}

export function findDashboardPatientMetricDefinition(
  metricId: DashboardPatientMetricId,
): DashboardPatientMetricDefinition | undefined {
  return DASHBOARD_PATIENT_METRIC_DEFINITIONS.find(
    (metric) => metric.id === metricId,
  );
}

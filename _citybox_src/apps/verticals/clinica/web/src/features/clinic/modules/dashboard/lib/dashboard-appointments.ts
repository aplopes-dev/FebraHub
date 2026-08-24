import type {
  ConsultasPeriodMode,
  DashboardAppointmentGroup,
  DashboardAppointmentOutcome,
  DashboardAppointmentRow,
  DashboardAppointmentsSummary,
  DashboardAppointmentsTimelinePoint,
} from '../types/clinic-dashboard';

export const CONSULTAS_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

export const CONSULTAS_MONTH_ABBREVIATIONS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export const APPOINTMENT_OUTCOME_LABELS: Record<
  DashboardAppointmentOutcome,
  string
> = {
  finished: 'Finalizada',
  missed: 'Falta',
  cancelled_patient: 'Cancelada pelo paciente',
  cancelled_pro: 'Cancelada pelo profissional',
};

export const ALL_APPOINTMENT_CATEGORIES = 'all' as const;

const MISSED_CANCELLED: ReadonlySet<DashboardAppointmentOutcome> = new Set([
  'missed',
  'cancelled_patient',
  'cancelled_pro',
]);

export function isMissedOrCancelled(
  status: DashboardAppointmentOutcome,
): boolean {
  return MISSED_CANCELLED.has(status);
}

export function getAppointmentGroup(
  status: DashboardAppointmentOutcome,
): DashboardAppointmentGroup {
  return status === 'finished' ? 'realized' : 'missed_cancelled';
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function emptyTimelinePoint(
  key: string,
  label: string,
): DashboardAppointmentsTimelinePoint {
  return { key, label, realized: 0, missedCancelled: 0 };
}

type FilterAppointmentsInput = {
  appointments: readonly DashboardAppointmentRow[];
  categoryId: string;
  periodMode: ConsultasPeriodMode;
  year: number;
  month?: number;
  group?: DashboardAppointmentGroup;
};

export function filterAppointments({
  appointments,
  categoryId,
  periodMode,
  year,
  month,
  group,
}: FilterAppointmentsInput): DashboardAppointmentRow[] {
  const yearPrefix = `${year}-`;
  const monthPrefix = `${year}-${String(month ?? 0).padStart(2, '0')}-`;

  return appointments.filter((appointment) => {
    const matchesPeriod =
      periodMode === 'annual'
        ? appointment.date.startsWith(yearPrefix)
        : appointment.date.startsWith(monthPrefix);
    const matchesCategory =
      categoryId === ALL_APPOINTMENT_CATEGORIES ||
      appointment.categoryId === categoryId;
    const matchesGroup =
      !group || getAppointmentGroup(appointment.status) === group;
    return matchesPeriod && matchesCategory && matchesGroup;
  });
}

export function summarizeAppointments(
  appointments: readonly DashboardAppointmentRow[],
): DashboardAppointmentsSummary {
  let realizedCount = 0;
  let missedCancelledCount = 0;

  for (const appointment of appointments) {
    if (appointment.status === 'finished') {
      realizedCount += 1;
    } else {
      missedCancelledCount += 1;
    }
  }

  const totalCount = realizedCount + missedCancelledCount;

  return {
    realizedCount,
    missedCancelledCount,
    totalCount,
    attendanceRate: totalCount > 0 ? (realizedCount / totalCount) * 100 : 0,
  };
}

export function buildAppointmentsTimeline({
  appointments,
  periodMode,
  year,
  month,
}: {
  appointments: readonly DashboardAppointmentRow[];
  periodMode: ConsultasPeriodMode;
  year: number;
  month?: number;
}): DashboardAppointmentsTimelinePoint[] {
  const points =
    periodMode === 'annual'
      ? CONSULTAS_MONTH_ABBREVIATIONS.map((label, index) =>
          emptyTimelinePoint(
            `${year}-${String(index + 1).padStart(2, '0')}`,
            label,
          ),
        )
      : Array.from({ length: daysInMonth(year, month ?? 1) }, (_, index) => {
          const day = index + 1;
          return emptyTimelinePoint(
            `${year}-${String(month ?? 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            String(day),
          );
        });

  const byKey = new Map(points.map((point) => [point.key, point]));

  for (const appointment of appointments) {
    const key =
      periodMode === 'annual' ? appointment.date.slice(0, 7) : appointment.date;
    const current = byKey.get(key);
    if (!current) continue;
    if (appointment.status === 'finished') {
      byKey.set(key, { ...current, realized: current.realized + 1 });
    } else {
      byKey.set(key, {
        ...current,
        missedCancelled: current.missedCancelled + 1,
      });
    }
  }

  return points.map((point) => byKey.get(point.key) ?? point);
}

export function getDashboardAppointmentYears(
  appointments: readonly DashboardAppointmentRow[],
): number[] {
  return [
    ...new Set(
      appointments.map((appointment) => Number(appointment.date.slice(0, 4))),
    ),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

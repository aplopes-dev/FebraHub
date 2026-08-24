import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import { civilDayEndUtc, civilDayStartUtc } from './dashboard-patients.dates';
import type {
  AppointmentDashboardRow,
  DashboardAppointmentDetailItem,
  DashboardAppointmentGroup,
  DashboardAppointmentOutcome,
  DashboardAppointmentsPeriodMode,
  DashboardAppointmentsSummary,
  DashboardAppointmentsTimelinePoint,
} from './dashboard-appointments.types';

export const DASHBOARD_APPOINTMENT_OUTCOMES: DashboardAppointmentOutcome[] = [
  'finished',
  'missed',
  'cancelled_patient',
  'cancelled_pro',
];

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

const MISSED_CANCELLED: ReadonlySet<DashboardAppointmentOutcome> = new Set([
  'missed',
  'cancelled_patient',
  'cancelled_pro',
]);

export function resolveAppointmentsPeriodRange(input: {
  periodMode: DashboardAppointmentsPeriodMode;
  year: number;
  month?: number;
}): { startIsoDate: string; endIsoDate: string; startAt: Date; endAt: Date } {
  const { periodMode, year, month } = input;
  let startIsoDate: string;
  let endIsoDate: string;

  if (periodMode === 'annual') {
    startIsoDate = `${year}-01-01`;
    endIsoDate = `${year}-12-31`;
  } else {
    if (month == null || month < 1 || month > 12) {
      throw new Error('month is required for monthly periodMode');
    }
    const padded = String(month).padStart(2, '0');
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    startIsoDate = `${year}-${padded}-01`;
    endIsoDate = `${year}-${padded}-${String(days).padStart(2, '0')}`;
  }

  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

export function getAppointmentGroup(
  status: DashboardAppointmentOutcome,
): DashboardAppointmentGroup {
  return status === 'finished' ? 'realized' : 'missed_cancelled';
}

export function isMissedOrCancelled(
  status: DashboardAppointmentOutcome,
): boolean {
  return MISSED_CANCELLED.has(status);
}

export function filterRowsByCategory(
  rows: readonly AppointmentDashboardRow[],
  categoryId: string | undefined,
): AppointmentDashboardRow[] {
  if (!categoryId || categoryId === 'all') return [...rows];
  return rows.filter((row) => row.categoryId === categoryId);
}

export function summarizeAppointments(
  rows: readonly AppointmentDashboardRow[],
): DashboardAppointmentsSummary {
  let realizedCount = 0;
  let missedCancelledCount = 0;

  for (const row of rows) {
    if (row.status === 'finished') {
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

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function emptyTimelinePoint(
  key: string,
  label: string,
): DashboardAppointmentsTimelinePoint {
  return { key, label, realized: 0, missedCancelled: 0 };
}

export function buildAppointmentsTimeline(input: {
  rows: readonly AppointmentDashboardRow[];
  periodMode: DashboardAppointmentsPeriodMode;
  year: number;
  month?: number;
}): DashboardAppointmentsTimelinePoint[] {
  const { rows, periodMode, year, month } = input;

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
          const paddedMonth = String(month ?? 1).padStart(2, '0');
          return emptyTimelinePoint(
            `${year}-${paddedMonth}-${String(day).padStart(2, '0')}`,
            String(day),
          );
        });

  const byKey = new Map(points.map((point) => [point.key, { ...point }]));

  for (const row of rows) {
    const date = toIsoDateOnly(row.startAt);
    const key = periodMode === 'annual' ? date.slice(0, 7) : date;
    const current = byKey.get(key);
    if (!current) continue;
    if (row.status === 'finished') {
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

export function toAppointmentDetailItem(
  row: AppointmentDashboardRow,
): DashboardAppointmentDetailItem {
  return {
    id: row.id,
    date: toIsoDateOnly(row.startAt),
    patientId: row.patientId,
    patientName: row.patientName,
    phone: row.phone,
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? '',
    status: row.status,
    professionalId: row.professionalId,
  };
}

export function filterAppointmentDetails(input: {
  rows: readonly AppointmentDashboardRow[];
  group: DashboardAppointmentGroup;
}): DashboardAppointmentDetailItem[] {
  return input.rows
    .filter((row) => getAppointmentGroup(row.status) === input.group)
    .map(toAppointmentDetailItem)
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return a.patientName.localeCompare(b.patientName, 'pt-BR');
    });
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  perPage: number,
): {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
} {
  const total = items.length;
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePerPage);
  const start = (safePage - 1) * safePerPage;

  return {
    items: items.slice(start, start + safePerPage),
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages,
  };
}

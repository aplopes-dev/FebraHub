import { civilDayEndUtc, civilDayStartUtc } from './dashboard-patients.dates';
import type {
  DashboardTicketMedioPeriodMode,
  DashboardTicketMedioPoint,
  DashboardTicketMedioReport,
  DashboardTicketMedioSeries,
  TicketMedioDayMetric,
} from './dashboard-ticket-medio.types';

export const TICKET_MEDIO_MONTH_ABBREVIATIONS = [
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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonthUtc(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function previousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month <= 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function resolveTicketMedioPeriodRange(input: {
  periodMode: DashboardTicketMedioPeriodMode;
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
    const padded = pad2(month);
    const days = daysInMonthUtc(year, month);
    startIsoDate = `${year}-${padded}-01`;
    endIsoDate = `${year}-${padded}-${pad2(days)}`;
  }

  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

/** Janela que cobre período corrente + anterior (uma query). */
export function resolveTicketMedioQueryWindow(input: {
  periodMode: DashboardTicketMedioPeriodMode;
  year: number;
  month?: number;
}): { startAt: Date; endAt: Date; startIsoDate: string; endIsoDate: string } {
  if (input.periodMode === 'annual') {
    const startIsoDate = `${input.year - 1}-01-01`;
    const endIsoDate = `${input.year}-12-31`;
    return {
      startIsoDate,
      endIsoDate,
      startAt: civilDayStartUtc(startIsoDate),
      endAt: civilDayEndUtc(endIsoDate),
    };
  }

  const month = input.month!;
  const prev = previousMonth(input.year, month);
  const current = resolveTicketMedioPeriodRange({
    periodMode: 'monthly',
    year: input.year,
    month,
  });
  const previous = resolveTicketMedioPeriodRange({
    periodMode: 'monthly',
    year: prev.year,
    month: prev.month,
  });

  return {
    startIsoDate: previous.startIsoDate,
    endIsoDate: current.endIsoDate,
    startAt: previous.startAt,
    endAt: current.endAt,
  };
}

function averageCurrentCents(
  points: readonly DashboardTicketMedioPoint[],
): number {
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, point) => acc + point.currentCents, 0);
  return Math.round(sum / points.length);
}

function buildSeries(
  points: DashboardTicketMedioPoint[],
): DashboardTicketMedioSeries {
  return {
    currentAverageCents: averageCurrentCents(points),
    points,
  };
}

function emptyDay(dateKey: string): TicketMedioDayMetric {
  return {
    dateKey,
    revenueCents: 0,
    expenseCents: 0,
    patientIds: [],
  };
}

function metricForDate(
  byDate: Map<string, TicketMedioDayMetric>,
  dateKey: string,
): TicketMedioDayMetric {
  return byDate.get(dateKey) ?? emptyDay(dateKey);
}

function rendimentoFrom(revenueCents: number, patientCount: number): number {
  if (patientCount <= 0) return 0;
  return Math.round(revenueCents / patientCount);
}

function aggregateMonthDistinct(
  byDate: Map<string, TicketMedioDayMetric>,
  year: number,
  month: number,
): { revenueCents: number; expenseCents: number; patientCount: number } {
  const prefix = `${year}-${pad2(month)}-`;
  let revenueCents = 0;
  let expenseCents = 0;
  const patients = new Set<string>();

  for (const [dateKey, metric] of byDate) {
    if (!dateKey.startsWith(prefix)) continue;
    revenueCents += metric.revenueCents;
    expenseCents += metric.expenseCents;
    for (const id of metric.patientIds) {
      patients.add(id);
    }
  }

  return {
    revenueCents,
    expenseCents,
    patientCount: patients.size,
  };
}

export function buildTicketMedioReport(input: {
  dayMetrics: readonly TicketMedioDayMetric[];
  periodMode: DashboardTicketMedioPeriodMode;
  year: number;
  month?: number;
}): DashboardTicketMedioReport {
  const byDate = new Map<string, TicketMedioDayMetric>();
  for (const row of input.dayMetrics) {
    byDate.set(row.dateKey, row);
  }

  if (input.periodMode === 'annual') {
    const rendimentoPoints: DashboardTicketMedioPoint[] = [];
    const lucratividadePoints: DashboardTicketMedioPoint[] = [];

    for (let m = 1; m <= 12; m += 1) {
      const currentAgg = aggregateMonthDistinct(byDate, input.year, m);
      const previousAgg = aggregateMonthDistinct(byDate, input.year - 1, m);
      const key = `${input.year}-${pad2(m)}`;
      const label = TICKET_MEDIO_MONTH_ABBREVIATIONS[m - 1] ?? String(m);

      rendimentoPoints.push({
        key,
        label,
        currentCents: rendimentoFrom(
          currentAgg.revenueCents,
          currentAgg.patientCount,
        ),
        previousCents: rendimentoFrom(
          previousAgg.revenueCents,
          previousAgg.patientCount,
        ),
      });
      lucratividadePoints.push({
        key,
        label,
        currentCents: currentAgg.revenueCents - currentAgg.expenseCents,
        previousCents: previousAgg.revenueCents - previousAgg.expenseCents,
      });
    }

    return {
      rendimento: buildSeries(rendimentoPoints),
      lucratividade: buildSeries(lucratividadePoints),
    };
  }

  const selectedMonth = input.month ?? 1;
  const prev = previousMonth(input.year, selectedMonth);
  const dayCount = daysInMonthUtc(input.year, selectedMonth);
  const prevDayCount = daysInMonthUtc(prev.year, prev.month);

  const rendimentoPoints: DashboardTicketMedioPoint[] = [];
  const lucratividadePoints: DashboardTicketMedioPoint[] = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const currentDate = `${input.year}-${pad2(selectedMonth)}-${pad2(day)}`;
    const currentMetric = metricForDate(byDate, currentDate);
    const previousMetric =
      day <= prevDayCount
        ? metricForDate(byDate, `${prev.year}-${pad2(prev.month)}-${pad2(day)}`)
        : emptyDay('');

    rendimentoPoints.push({
      key: currentDate,
      label: String(day),
      currentCents: rendimentoFrom(
        currentMetric.revenueCents,
        currentMetric.patientIds.length,
      ),
      previousCents: rendimentoFrom(
        previousMetric.revenueCents,
        previousMetric.patientIds.length,
      ),
    });
    lucratividadePoints.push({
      key: currentDate,
      label: String(day),
      currentCents: currentMetric.revenueCents - currentMetric.expenseCents,
      previousCents: previousMetric.revenueCents - previousMetric.expenseCents,
    });
  }

  return {
    rendimento: buildSeries(rendimentoPoints),
    lucratividade: buildSeries(lucratividadePoints),
  };
}

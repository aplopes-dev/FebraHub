import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import {
  civilDayEndUtc,
  civilDayStartUtc,
} from './dashboard-patients.dates';
import type {
  CashflowEntryRow,
  ClassifiedCashflowBucket,
  DashboardCashflowPeriodMode,
  DashboardCashflowTimelinePoint,
  DashboardCashflowTotals,
} from './dashboard-cashflow.types';

export const CASHFLOW_MONTH_ABBREVIATIONS = [
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

export function resolveCashflowPeriodRange(input: {
  periodMode: DashboardCashflowPeriodMode;
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

export function classifyCashflowEntry(
  entry: Pick<CashflowEntryRow, 'dueDate' | 'paidAt'>,
  todayKey: string,
): ClassifiedCashflowBucket {
  if (entry.paidAt != null) {
    const paidKey = toIsoDateOnly(entry.paidAt);
    if (paidKey > todayKey) return 'excluded';
    return 'paid';
  }
  const dueKey = toIsoDateOnly(entry.dueDate);
  if (dueKey > todayKey) return 'forecast';
  return 'excluded';
}

export function resolveCashflowAmountCents(
  entry: CashflowEntryRow,
  bucket: ClassifiedCashflowBucket,
): number {
  if (bucket === 'paid') {
    return entry.paidValueCents ?? entry.valueCents;
  }
  return entry.valueCents;
}

function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function emptyPoint(key: string, label: string): DashboardCashflowTimelinePoint {
  return {
    key,
    label,
    incomePaid: 0,
    incomeForecast: 0,
    expensePaid: 0,
    expenseForecast: 0,
    balance: 0,
    balanceForecast: 0,
  };
}

function isInPeriod(
  dateKey: string,
  periodMode: DashboardCashflowPeriodMode,
  year: number,
  month?: number,
): boolean {
  if (periodMode === 'annual') return dateKey.startsWith(`${year}-`);
  const prefix = `${year}-${String(month ?? 0).padStart(2, '0')}-`;
  return dateKey.startsWith(prefix);
}

export function buildCashflowReport(input: {
  rows: readonly CashflowEntryRow[];
  periodMode: DashboardCashflowPeriodMode;
  year: number;
  month?: number;
  todayKey: string;
}): {
  totals: DashboardCashflowTotals;
  timeline: DashboardCashflowTimelinePoint[];
} {
  const { rows, periodMode, year, month, todayKey } = input;

  const points =
    periodMode === 'annual'
      ? CASHFLOW_MONTH_ABBREVIATIONS.map((label, index) =>
          emptyPoint(`${year}-${String(index + 1).padStart(2, '0')}`, label),
        )
      : Array.from({ length: daysInMonth(year, month ?? 1) }, (_, index) => {
          const day = index + 1;
          const paddedMonth = String(month ?? 1).padStart(2, '0');
          return emptyPoint(
            `${year}-${paddedMonth}-${String(day).padStart(2, '0')}`,
            String(day),
          );
        });

  const byKey = new Map(points.map((point) => [point.key, { ...point }]));

  let incomeCents = 0;
  let expenseCents = 0;

  for (const entry of rows) {
    const bucket = classifyCashflowEntry(entry, todayKey);
    if (bucket === 'excluded') continue;

    const dateKey =
      bucket === 'paid'
        ? toIsoDateOnly(entry.paidAt as Date)
        : toIsoDateOnly(entry.dueDate);
    if (!isInPeriod(dateKey, periodMode, year, month)) continue;

    const pointKey = periodMode === 'annual' ? dateKey.slice(0, 7) : dateKey;
    const current = byKey.get(pointKey);
    if (!current) continue;

    const amountCents = resolveCashflowAmountCents(entry, bucket);
    const reais = centsToReais(amountCents);

    if (entry.type === 'income') {
      incomeCents += amountCents;
      if (bucket === 'paid') {
        byKey.set(pointKey, {
          ...current,
          incomePaid: current.incomePaid + reais,
        });
      } else {
        byKey.set(pointKey, {
          ...current,
          incomeForecast: current.incomeForecast + reais,
        });
      }
    } else {
      expenseCents += amountCents;
      if (bucket === 'paid') {
        byKey.set(pointKey, {
          ...current,
          expensePaid: current.expensePaid + reais,
        });
      } else {
        byKey.set(pointKey, {
          ...current,
          expenseForecast: current.expenseForecast + reais,
        });
      }
    }
  }

  let runningPaid = 0;
  let runningAll = 0;
  const timeline = points.map((point) => {
    const current = byKey.get(point.key) ?? point;
    const paidDelta = current.incomePaid - current.expensePaid;
    const allDelta =
      current.incomePaid +
      current.incomeForecast -
      (current.expensePaid + current.expenseForecast);
    runningPaid += paidDelta;
    runningAll += allDelta;
    return {
      ...current,
      balance: Math.round(runningPaid * 100) / 100,
      balanceForecast: Math.round(runningAll * 100) / 100,
    };
  });

  return {
    totals: {
      incomeCents,
      expenseCents,
      balanceCents: incomeCents - expenseCents,
    },
    timeline,
  };
}

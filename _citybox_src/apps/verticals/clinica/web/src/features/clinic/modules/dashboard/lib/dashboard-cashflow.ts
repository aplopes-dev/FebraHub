import type {
  CashflowPeriodMode,
  DashboardCashflowEntry,
  DashboardCashflowTimelinePoint,
  DashboardCashflowTotals,
} from '../types/clinic-dashboard';

export const CASHFLOW_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

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

export const CASHFLOW_SERIES_COLORS = {
  incomePaid: '#16a34a',
  incomeForecast: '#86efac',
  expensePaid: '#ef4444',
  expenseForecast: '#f9a8d4',
  balance: '#3b82f6',
  balanceForecast: '#1e3a8a',
} as const;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
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

function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

function isInPeriod(
  dateKey: string,
  periodMode: CashflowPeriodMode,
  year: number,
  month?: number,
): boolean {
  if (periodMode === 'annual') return dateKey.startsWith(`${year}-`);
  const prefix = `${year}-${String(month ?? 0).padStart(2, '0')}-`;
  return dateKey.startsWith(prefix);
}

export type ClassifiedCashflowBucket = 'paid' | 'forecast' | 'excluded';

/** Classifica lançamento relativo a `today` (yyyy-MM-dd local). */
export function classifyCashflowEntry(
  entry: DashboardCashflowEntry,
  todayKey: string,
): ClassifiedCashflowBucket {
  if (entry.paidAt != null) {
    if (entry.paidAt > todayKey) return 'excluded'; // pagamento futuro
    return 'paid';
  }
  if (entry.dueDate > todayKey) return 'forecast';
  return 'excluded'; // overdue ou dueDate === today unpaid → tratado como excluído se ≤ today
}

type BuildCashflowReportInput = {
  entries: readonly DashboardCashflowEntry[];
  periodMode: CashflowPeriodMode;
  year: number;
  month?: number;
  today?: Date;
};

export function buildCashflowReport({
  entries,
  periodMode,
  year,
  month,
  today: todayProp,
}: BuildCashflowReportInput): {
  totals: DashboardCashflowTotals;
  timeline: DashboardCashflowTimelinePoint[];
} {
  const today = todayProp ?? new Date();
  const todayKey = toDateKey(today);

  const points =
    periodMode === 'annual'
      ? CASHFLOW_MONTH_ABBREVIATIONS.map((label, index) =>
          emptyPoint(`${year}-${String(index + 1).padStart(2, '0')}`, label),
        )
      : Array.from({ length: daysInMonth(year, month ?? 1) }, (_, index) => {
          const day = index + 1;
          return emptyPoint(
            `${year}-${String(month ?? 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            String(day),
          );
        });

  const byKey = new Map(points.map((point) => [point.key, { ...point }]));

  let incomeCents = 0;
  let expenseCents = 0;

  for (const entry of entries) {
    const bucket = classifyCashflowEntry(entry, todayKey);
    if (bucket === 'excluded') continue;

    const dateKey = bucket === 'paid' ? (entry.paidAt as string) : entry.dueDate;
    if (!isInPeriod(dateKey, periodMode, year, month)) continue;

    const pointKey =
      periodMode === 'annual' ? dateKey.slice(0, 7) : dateKey;
    const current = byKey.get(pointKey);
    if (!current) continue;

    const reais = centsToReais(entry.valueCents);

    if (entry.side === 'income') {
      incomeCents += entry.valueCents;
      if (bucket === 'paid') {
        byKey.set(pointKey, { ...current, incomePaid: current.incomePaid + reais });
      } else {
        byKey.set(pointKey, {
          ...current,
          incomeForecast: current.incomeForecast + reais,
        });
      }
    } else {
      expenseCents += entry.valueCents;
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

export function getCashflowYears(
  entries: readonly DashboardCashflowEntry[],
): number[] {
  const years = new Set<number>();
  for (const entry of entries) {
    years.add(Number(entry.dueDate.slice(0, 4)));
    if (entry.paidAt) years.add(Number(entry.paidAt.slice(0, 4)));
  }
  return [...years].filter(Number.isFinite).sort((a, b) => b - a);
}

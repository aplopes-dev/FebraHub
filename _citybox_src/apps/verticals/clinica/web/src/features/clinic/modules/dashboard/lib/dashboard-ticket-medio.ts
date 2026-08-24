import type {
  DashboardTicketMedioDayMetric,
  DashboardTicketMedioPoint,
  DashboardTicketMedioReport,
  DashboardTicketMedioSeries,
  DashboardTicketMedioYAxis,
  TicketMedioPeriodMode,
} from '../types/clinic-dashboard';

export const TICKET_MEDIO_PERIOD_MODE_OPTIONS = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
] as const;

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

export const TICKET_MEDIO_SERIES_COLORS = {
  current: '#16a34a',
  previous: '#94a3b8',
} as const;

/** Passos “bonitos” em centavos (preferência por múltiplos de 50 mil quando couber). */
const NICE_Y_STEPS_CENTS = [
  50_00, // R$ 50
  100_00,
  250_00,
  500_00,
  1_000_00, // R$ 1.000
  2_500_00,
  5_000_00,
  10_000_00,
  25_000_00,
  50_000_00, // R$ 50.000
  100_000_00,
  250_000_00,
  500_000_00,
  1_000_000_00, // R$ 1 mi
  2_500_000_00,
  5_000_000_00,
] as const;

const TARGET_Y_INTERVALS = 4;

function resolveNiceStepCents(rawStepCents: number): number {
  for (const step of NICE_Y_STEPS_CENTS) {
    if (step >= rawStepCents) return step;
  }
  const last = NICE_Y_STEPS_CENTS[NICE_Y_STEPS_CENTS.length - 1]!;
  return Math.ceil(rawStepCents / last) * last;
}

/**
 * Define ticks do eixo Y (padrão 0 / 50 mil / 100 mil… quando a escala for alta).
 * Sempre mira ~4–5 intervalos para o gráfico não ficar só com 2 valores.
 */
export function resolveTicketMedioYAxis(maxCents: number): DashboardTicketMedioYAxis {
  const safeMax = Math.max(0, maxCents);
  if (safeMax === 0) {
    const step = 50_000_00;
    return { domain: [0, step], ticks: [0, step / 2, step] };
  }

  const step = resolveNiceStepCents(safeMax / TARGET_Y_INTERVALS);
  const maxTick = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= maxTick; value += step) {
    ticks.push(value);
  }

  // Garante pelo menos 3 ticks (0, meio, teto) se arredondamento colapsar.
  if (ticks.length < 3) {
    return { domain: [0, step * 2], ticks: [0, step, step * 2] };
  }

  return { domain: [0, maxTick], ticks };
}


function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function previousMonth(year: number, month: number): { year: number; month: number } {
  if (month <= 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function averageCurrentCents(points: readonly DashboardTicketMedioPoint[]): number {
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, point) => acc + point.currentCents, 0);
  return Math.round(sum / points.length);
}

function metricForDate(
  byDate: Map<string, DashboardTicketMedioDayMetric>,
  date: string,
): DashboardTicketMedioDayMetric {
  return (
    byDate.get(date) ?? {
      date,
      revenueCents: 0,
      expenseCents: 0,
      patientCount: 0,
    }
  );
}

function rendimentoCents(metric: DashboardTicketMedioDayMetric): number {
  if (metric.patientCount <= 0) return 0;
  return Math.round(metric.revenueCents / metric.patientCount);
}

function lucratividadeCents(metric: DashboardTicketMedioDayMetric): number {
  return metric.revenueCents - metric.expenseCents;
}

function aggregateMonth(
  byDate: Map<string, DashboardTicketMedioDayMetric>,
  year: number,
  month: number,
): { revenueCents: number; expenseCents: number; patientCount: number } {
  const prefix = `${year}-${pad2(month)}-`;
  let revenueCents = 0;
  let expenseCents = 0;
  let patientCount = 0;
  for (const [date, metric] of byDate) {
    if (!date.startsWith(prefix)) continue;
    revenueCents += metric.revenueCents;
    expenseCents += metric.expenseCents;
    patientCount += metric.patientCount;
  }
  return { revenueCents, expenseCents, patientCount };
}

function monthRendimentoCents(agg: {
  revenueCents: number;
  patientCount: number;
}): number {
  if (agg.patientCount <= 0) return 0;
  return Math.round(agg.revenueCents / agg.patientCount);
}

function buildSeriesFromPoints(
  points: DashboardTicketMedioPoint[],
): DashboardTicketMedioSeries {
  return {
    currentAverageCents: averageCurrentCents(points),
    points,
  };
}

export function getTicketMedioYears(
  metrics: readonly DashboardTicketMedioDayMetric[],
): number[] {
  return [
    ...new Set(metrics.map((row) => Number(row.date.slice(0, 4)))),
  ]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

export function resolveTicketMedioLegendLabels(
  periodMode: TicketMedioPeriodMode,
): { current: string; previous: string } {
  if (periodMode === 'annual') {
    return { current: 'Ano corrente', previous: 'Ano anterior' };
  }
  return { current: 'Mês corrente', previous: 'Mês anterior' };
}

/** Formata tick do eixo Y: `0`, `50 mil`, `100 mil`, `1 mi`, `1,5 mi`. */
export function formatTicketMedioYTick(cents: number): string {
  const reais = cents / 100;
  if (reais === 0) return '0';

  if (reais >= 1_000_000) {
    const mi = reais / 1_000_000;
    const formatted =
      mi % 1 === 0
        ? String(mi)
        : mi.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return `${formatted} mi`;
  }

  if (reais >= 1000) {
    const mil = reais / 1000;
    const formatted =
      mil % 1 === 0
        ? String(mil)
        : mil.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    return `${formatted} mil`;
  }

  return reais.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function maxSeriesCents(
  series: DashboardTicketMedioSeries,
): number {
  let max = 0;
  for (const point of series.points) {
    max = Math.max(max, point.currentCents, point.previousCents);
  }
  return max;
}

type BuildTimelineInput = {
  metrics: readonly DashboardTicketMedioDayMetric[];
  periodMode: TicketMedioPeriodMode;
  year: number;
  month?: number;
};

export function buildTicketMedioTimeline({
  metrics,
  periodMode,
  year,
  month,
}: BuildTimelineInput): DashboardTicketMedioReport {
  const byDate = new Map<string, DashboardTicketMedioDayMetric>();
  for (const row of metrics) {
    byDate.set(row.date, row);
  }

  if (periodMode === 'annual') {
    const rendimentoPoints: DashboardTicketMedioPoint[] = [];
    const lucratividadePoints: DashboardTicketMedioPoint[] = [];

    for (let m = 1; m <= 12; m += 1) {
      const currentAgg = aggregateMonth(byDate, year, m);
      const previousAgg = aggregateMonth(byDate, year - 1, m);
      const key = `${year}-${pad2(m)}`;
      const label = TICKET_MEDIO_MONTH_ABBREVIATIONS[m - 1] ?? String(m);

      rendimentoPoints.push({
        key,
        label,
        currentCents: monthRendimentoCents(currentAgg),
        previousCents: monthRendimentoCents(previousAgg),
      });
      lucratividadePoints.push({
        key,
        label,
        currentCents: currentAgg.revenueCents - currentAgg.expenseCents,
        previousCents: previousAgg.revenueCents - previousAgg.expenseCents,
      });
    }

    return {
      rendimento: buildSeriesFromPoints(rendimentoPoints),
      lucratividade: buildSeriesFromPoints(lucratividadePoints),
    };
  }

  const selectedMonth = month ?? 1;
  const prev = previousMonth(year, selectedMonth);
  const dayCount = daysInMonth(year, selectedMonth);
  const prevDayCount = daysInMonth(prev.year, prev.month);

  const rendimentoPoints: DashboardTicketMedioPoint[] = [];
  const lucratividadePoints: DashboardTicketMedioPoint[] = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const currentDate = `${year}-${pad2(selectedMonth)}-${pad2(day)}`;
    const currentMetric = metricForDate(byDate, currentDate);
    const previousMetric =
      day <= prevDayCount
        ? metricForDate(
            byDate,
            `${prev.year}-${pad2(prev.month)}-${pad2(day)}`,
          )
        : {
            date: '',
            revenueCents: 0,
            expenseCents: 0,
            patientCount: 0,
          };

    rendimentoPoints.push({
      key: currentDate,
      label: String(day),
      currentCents: rendimentoCents(currentMetric),
      previousCents: rendimentoCents(previousMetric),
    });
    lucratividadePoints.push({
      key: currentDate,
      label: String(day),
      currentCents: lucratividadeCents(currentMetric),
      previousCents: lucratividadeCents(previousMetric),
    });
  }

  return {
    rendimento: buildSeriesFromPoints(rendimentoPoints),
    lucratividade: buildSeriesFromPoints(lucratividadePoints),
  };
}

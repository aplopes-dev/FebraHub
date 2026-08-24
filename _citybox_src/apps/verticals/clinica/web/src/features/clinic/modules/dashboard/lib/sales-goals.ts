import {
  formatLocalDateString,
  parseLocalDateString,
} from '@/features/clinic/agenda/lib/local-date';
import type {
  DashboardDailySale,
  DashboardHoliday,
  SalesGoalTimelinePoint,
} from '../types/clinic-dashboard';

export function toLocalDateKey(date: Date): string {
  return formatLocalDateString(date);
}

export function parseLocalDateKey(dateKey: string): Date {
  return parseLocalDateString(dateKey);
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isHoliday(
  date: Date,
  holidays: readonly DashboardHoliday[],
): boolean {
  const key = toLocalDateKey(date);
  return holidays.some((holiday) => holiday.date === key);
}

export function isBusinessDay(
  date: Date,
  holidays: readonly DashboardHoliday[],
): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Dias úteis de amanhã até o último dia do mês (hoje não conta).
 * Se `today` não estiver no mês filtrado, conta todos os úteis do mês
 * quando o mês é futuro; se passado, retorna 0.
 */
export function countRemainingBusinessDays(input: {
  year: number;
  month: number;
  today: Date;
  holidays: readonly DashboardHoliday[];
}): number {
  const { year, month, today, holidays } = input;
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth(year, month));

  let cursor: Date;
  if (
    todayLocal.getFullYear() === year &&
    todayLocal.getMonth() + 1 === month
  ) {
    cursor = addLocalDays(todayLocal, 1);
  } else if (todayLocal < monthStart) {
    cursor = monthStart;
  } else {
    return 0;
  }

  let count = 0;
  while (cursor <= monthEnd) {
    if (isBusinessDay(cursor, holidays)) count += 1;
    cursor = addLocalDays(cursor, 1);
  }
  return count;
}

export function countBusinessDaysInMonth(input: {
  year: number;
  month: number;
  holidays: readonly DashboardHoliday[];
}): number {
  const { year, month, holidays } = input;
  const totalDays = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month - 1, day);
    if (isBusinessDay(date, holidays)) count += 1;
  }
  return count;
}

export function sumDailySalesCents(
  dailySales: readonly DashboardDailySale[],
): number {
  return dailySales.reduce((total, row) => total + row.valueCents, 0);
}

export function sumDailySalesOnDate(
  dailySales: readonly DashboardDailySale[],
  date: Date | string,
): number {
  const key = typeof date === 'string' ? date : toLocalDateKey(date);
  return dailySales
    .filter((row) => row.date === key)
    .reduce((total, row) => total + row.valueCents, 0);
}

/** Soma as vendas do mês civil `year`/`month` (prefixo `yyyy-MM`). */
export function sumDailySalesInMonth(
  dailySales: readonly DashboardDailySale[],
  input: { year: number; month: number },
): number {
  const prefix = `${input.year}-${String(input.month).padStart(2, '0')}`;
  return dailySales
    .filter((row) => row.date.startsWith(prefix))
    .reduce((total, row) => total + row.valueCents, 0);
}

/**
 * Percentual do realizado sobre a meta, 1 casa decimal, sem teto —
 * pode passar de 100% quando a meta é superada (a barra limita a exibição).
 */
export function calcGoalProgressPercent(
  realizedCents: number,
  goalCents: number,
): number {
  if (goalCents <= 0) return 0;
  return Math.round((realizedCents / goalCents) * 1000) / 10;
}

export function calcNeededPerBusinessDay(
  remainingCents: number,
  remainingBusinessDays: number,
): number {
  if (remainingBusinessDays <= 0) return 0;
  return Math.max(0, Math.ceil(remainingCents / remainingBusinessDays));
}

export function calcDailyGoalPercent(
  soldTodayCents: number,
  neededPerDayCents: number,
  hasGoal = true,
): number {
  if (!hasGoal || neededPerDayCents <= 0) return 0;
  return Math.min(
    100,
    Math.round((soldTodayCents / neededPerDayCents) * 1000) / 10,
  );
}

/**
 * Série do mês selecionado (visão mensal da meta):
 * - todos os dias do mês, mesmo com meta criada no meio do mês;
 * - só entram vendas do próprio mês (e >= startDate) — o acumulado
 *   zera na troca de mês, sem carregar meses anteriores;
 * - dias futuros mantêm o acumulado do mês (linha flat);
 * - meta esperada em rampa linear (meta ÷ dias úteis do mês, acumulando
 *   só em dias úteis, fechando no valor da meta no último dia útil).
 */
export function buildMonthlySalesSeries(input: {
  dailySales: readonly DashboardDailySale[];
  startDate: string;
  year: number;
  month: number;
  goalCents: number;
  holidays: readonly DashboardHoliday[];
}): SalesGoalTimelinePoint[] {
  const { dailySales, startDate, year, month, goalCents, holidays } = input;
  if (!startDate) return [];

  const totalDays = daysInMonth(year, month);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const businessDaysInMonth = countBusinessDaysInMonth({
    year,
    month,
    holidays,
  });

  const byDate = new Map<string, number>();

  for (const row of dailySales) {
    if (row.date < startDate) continue;
    if (!row.date.startsWith(monthPrefix)) continue;
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.valueCents);
  }

  let cumulativeCents = 0;
  let businessDaysElapsed = 0;

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const key = toLocalDateKey(date);
    cumulativeCents += byDate.get(key) ?? 0;

    if (isBusinessDay(date, holidays) && businessDaysInMonth > 0) {
      businessDaysElapsed += 1;
    }

    const expectedCumulativeCents =
      businessDaysInMonth > 0 && goalCents > 0
        ? Math.round((businessDaysElapsed / businessDaysInMonth) * goalCents)
        : 0;

    return {
      day,
      date: key,
      label: String(day),
      realizedCumulative: cumulativeCents / 100,
      expected: expectedCumulativeCents / 100,
      realizedCumulativeCents: cumulativeCents,
      expectedCumulativeCents,
    };
  });
}

export function calcPaceVariance(input: {
  realizedCents: number;
  expectedCents: number;
}): {
  diffCents: number;
  absDiffCents: number;
  direction: 'above' | 'below' | 'on_track';
  percent: number;
} {
  const diffCents = input.realizedCents - input.expectedCents;
  if (diffCents === 0) {
    return {
      diffCents: 0,
      absDiffCents: 0,
      direction: 'on_track',
      percent: 0,
    };
  }
  const percent =
    input.expectedCents > 0
      ? Math.round((Math.abs(diffCents) / input.expectedCents) * 1000) / 10
      : input.realizedCents > 0
        ? 100
        : 0;
  return {
    diffCents,
    absDiffCents: Math.abs(diffCents),
    direction: diffCents > 0 ? 'above' : 'below',
    percent,
  };
}

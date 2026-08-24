import type { CashFlowPeriodFilter } from '../types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeekMonday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
}

export function resolvePeriodDates(
  period: CashFlowPeriodFilter,
  customStart?: Date,
  customEnd?: Date,
): { startDate: string; endDate: string } {
  const today = startOfToday();
  switch (period) {
    case 'today':
      return { startDate: toIsoDate(today), endDate: toIsoDate(today) };
    case 'this_week':
      return {
        startDate: toIsoDate(startOfWeekMonday(today)),
        endDate: toIsoDate(endOfWeekMonday(today)),
      };
    case 'this_month':
      return {
        startDate: toIsoDate(startOfMonth(today)),
        endDate: toIsoDate(endOfMonth(today)),
      };
    case 'last_month': {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 15, 12);
      return {
        startDate: toIsoDate(startOfMonth(lm)),
        endDate: toIsoDate(endOfMonth(lm)),
      };
    }
    case 'last_30_days':
      return {
        startDate: toIsoDate(addDays(today, -30)),
        endDate: toIsoDate(today),
      };
    case 'next_30_days':
      return {
        startDate: toIsoDate(today),
        endDate: toIsoDate(addDays(today, 30)),
      };
    case 'custom':
      if (customStart && customEnd) {
        return {
          startDate: toIsoDate(customStart),
          endDate: toIsoDate(customEnd),
        };
      }
      return { startDate: toIsoDate(today), endDate: toIsoDate(today) };
    case 'all':
    default:
      return {
        startDate: toIsoDate(addDays(today, -365)),
        endDate: toIsoDate(addDays(today, 365)),
      };
  }
}

export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/** Interpreta `YYYY-MM-DD` no calendário local (meio-dia, evita fuso). */
export function parseIsoDate(isoDate: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

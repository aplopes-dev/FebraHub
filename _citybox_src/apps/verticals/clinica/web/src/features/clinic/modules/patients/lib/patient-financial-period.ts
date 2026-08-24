export type PatientFinancialPeriod =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'next_30_days'
  | 'custom';

export type PatientFinancialDateRange = {
  start: string;
  end: string;
};

export const PATIENT_FINANCIAL_PERIOD_OPTIONS: {
  value: PatientFinancialPeriod;
  label: string;
}[] = [
  { value: 'all', label: 'Todos os períodos' },
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Desta semana' },
  { value: 'this_month', label: 'Deste mês' },
  { value: 'last_month', label: 'Do mês passado' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'next_30_days', label: 'Próximos 30 dias' },
  { value: 'custom', label: 'Escolher período' },
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekRange(baseDate: Date): PatientFinancialDateRange {
  const day = baseDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(startOfDay(baseDate), diffToMonday);
  const saturday = addDays(monday, 5);
  return { start: toIsoDate(monday), end: toIsoDate(saturday) };
}

function getMonthRange(year: number, month: number): PatientFinancialDateRange {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export function resolvePeriodDateRange(
  period: PatientFinancialPeriod,
  customStart?: string | null,
  customEnd?: string | null,
  baseDate = new Date(),
): PatientFinancialDateRange | null {
  const today = startOfDay(baseDate);

  switch (period) {
    case 'all':
      return null;
    case 'today':
      return { start: toIsoDate(today), end: toIsoDate(today) };
    case 'this_week':
      return getWeekRange(today);
    case 'this_month':
      return getMonthRange(today.getFullYear(), today.getMonth());
    case 'last_month': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return getMonthRange(lastMonth.getFullYear(), lastMonth.getMonth());
    }
    case 'last_30_days':
      return { start: toIsoDate(addDays(today, -30)), end: toIsoDate(today) };
    case 'next_30_days':
      return { start: toIsoDate(today), end: toIsoDate(addDays(today, 30)) };
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return null;
    default:
      return null;
  }
}

export function isDateWithinRange(
  date: string,
  range: PatientFinancialDateRange | null,
): boolean {
  if (!range) return true;
  return date >= range.start && date <= range.end;
}

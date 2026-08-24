import type {
  DashboardFinancialSummary,
  DashboardFinancialSummaryByPeriod,
} from '../types/clinic-dashboard';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';

export const DASHBOARD_MONTH_OPTIONS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const;

const CURRENT_DASHBOARD_DATE = new Date();

export const DEFAULT_DASHBOARD_FINANCIAL_MONTH =
  CURRENT_DASHBOARD_DATE.getMonth() + 1;
export const DEFAULT_DASHBOARD_FINANCIAL_YEAR =
  CURRENT_DASHBOARD_DATE.getFullYear();
export const DASHBOARD_YEAR_OPTIONS = [
  DEFAULT_DASHBOARD_FINANCIAL_YEAR - 1,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
] as const;

export const EMPTY_DASHBOARD_FINANCIAL_SUMMARY: DashboardFinancialSummary = {
  income: { receivedCents: 0, toReceiveCents: 0, totalCents: 0 },
  expense: { paidCents: 0, toPayCents: 0, totalCents: 0 },
  balance: { currentCents: 0, projectedCents: 0 },
};

export function buildFinancialPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Civil month bounds as `yyyy-MM-dd` (local calendar, inclusive). */
export function resolveFinancialMonthDateRange(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    startDate: formatLocalDateString(start),
    endDate: formatLocalDateString(end),
  };
}

export function resolveDashboardFinancialSummary(
  summaries: DashboardFinancialSummaryByPeriod,
  year: number,
  month: number,
): DashboardFinancialSummary {
  return (
    summaries[buildFinancialPeriodKey(year, month)] ??
    EMPTY_DASHBOARD_FINANCIAL_SUMMARY
  );
}

export function calculateFinancialProgress(
  settledCents: number,
  totalCents: number,
): number {
  if (totalCents <= 0) return 0;
  return Math.min(Math.max((settledCents / totalCents) * 100, 0), 100);
}

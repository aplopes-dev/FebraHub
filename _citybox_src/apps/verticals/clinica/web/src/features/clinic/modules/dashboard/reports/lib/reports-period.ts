import { formatPdfPeriodLabel } from '@/features/clinic/lib/format-pdf-period-label';
import {
  endOfMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import type {
  ReportBudgetPeriodMode,
  ReportPeriodFilter,
} from '../types/clinic-reports';
import {
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
  DASHBOARD_MONTH_OPTIONS,
  DASHBOARD_YEAR_OPTIONS,
} from '../../lib/dashboard-financial';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { resolveBirthdayPeriodRange } from '../../lib/birthday-period';

export const REPORT_PERIOD_OPTIONS: {
  value: ReportPeriodFilter;
  label: string;
}[] = [
  { value: 'today', label: 'De hoje' },
  { value: 'this_week', label: 'Dessa semana' },
  { value: 'this_month', label: 'Desse mês' },
  { value: 'last_month', label: 'Do mês passado' },
  { value: 'last_30_days', label: 'Dos últimos 30 dias' },
  { value: 'custom', label: 'Escolher período' },
];

export const DEFAULT_REPORT_PERIOD: ReportPeriodFilter = 'this_month';

export const REPORT_BUDGET_PERIOD_MODE_OPTIONS: {
  value: ReportBudgetPeriodMode;
  label: string;
}[] = [
  { value: 'annual', label: 'Anual' },
  { value: 'monthly', label: 'Mensal' },
];

export const DEFAULT_REPORT_BUDGET_PERIOD_MODE: ReportBudgetPeriodMode =
  'monthly';

export const REPORT_BUDGET_MONTH_OPTIONS = DASHBOARD_MONTH_OPTIONS;
export const REPORT_BUDGET_YEAR_OPTIONS = DASHBOARD_YEAR_OPTIONS;
export const DEFAULT_REPORT_BUDGET_MONTH = DEFAULT_DASHBOARD_FINANCIAL_MONTH;
export const DEFAULT_REPORT_BUDGET_YEAR = DEFAULT_DASHBOARD_FINANCIAL_YEAR;

export type ReportBirthdayPeriodRange = {
  startDate: string;
  endDate: string;
};

export type ReportBudgetPeriodRange = {
  startDate: string;
  endDate: string;
};

/**
 * Resolve o filtro Anual/Mensal dos relatórios de orçamento para `startDate`/`endDate`.
 */
export function resolveReportBudgetPeriodRange(input: {
  mode: ReportBudgetPeriodMode;
  year: number;
  month: number;
}): ReportBudgetPeriodRange {
  if (input.mode === 'annual') {
    return {
      startDate: `${input.year}-01-01`,
      endDate: `${input.year}-12-31`,
    };
  }

  const monthStart = new Date(input.year, input.month - 1, 1);
  return {
    startDate: formatLocalDateString(startOfMonth(monthStart)),
    endDate: formatLocalDateString(endOfMonth(monthStart)),
  };
}

/**
 * Label legível do período budget para PDF / meta.
 */
export function formatReportBudgetPeriodLabel(input: {
  mode: ReportBudgetPeriodMode;
  year: number;
  month: number;
}): string {
  if (input.mode === 'annual') {
    return `Anual ${input.year}`;
  }

  const monthLabel =
    REPORT_BUDGET_MONTH_OPTIONS.find((option) => option.value === input.month)
      ?.label ?? String(input.month);
  return `Mensal ${monthLabel}/${input.year}`;
}

/**
 * Resolve o filtro relativo do relatório Aniversariantes para `startDate`/`endDate`.
 * `last_month` é exclusivo do reports; demais reutilizam `resolveBirthdayPeriodRange`.
 * `custom` sem datas → dia atual (DatePickers fora de escopo).
 */
export function resolveReportBirthdayRange(
  period: ReportPeriodFilter,
  referenceDate: Date = new Date(),
): ReportBirthdayPeriodRange {
  if (period === 'last_month') {
    const today = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const previous = subMonths(today, 1);
    return {
      startDate: formatLocalDateString(startOfMonth(previous)),
      endDate: formatLocalDateString(endOfMonth(previous)),
    };
  }

  if (period === 'custom') {
    return resolveBirthdayPeriodRange('custom', referenceDate);
  }

  return resolveBirthdayPeriodRange(period, referenceDate);
}

export function formatReportBirthdayPdfPeriodLabel(
  period: ReportPeriodFilter,
  referenceDate: Date = new Date(),
): string {
  const range = resolveReportBirthdayRange(period, referenceDate);
  return formatPdfPeriodLabel(range.startDate, range.endDate);
}

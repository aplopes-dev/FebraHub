import { formatPdfPeriodLabel } from '@/features/clinic/lib/format-pdf-period-label';
import type { RevenuePeriodFilter } from '../types/clinic-dashboard';
import {
  BIRTHDAY_PERIOD_OPTIONS,
  resolveBirthdayPeriodRange,
} from './birthday-period';

export const REVENUE_PERIOD_OPTIONS: {
  value: RevenuePeriodFilter;
  label: string;
}[] = BIRTHDAY_PERIOD_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export const DEFAULT_REVENUE_PERIOD: RevenuePeriodFilter = 'today';

export const resolveRevenuePeriodRange = resolveBirthdayPeriodRange;

export function formatRevenuePdfPeriodLabel(
  period: RevenuePeriodFilter,
  referenceDate: Date = new Date(),
  customStart?: Date,
  customEnd?: Date,
): string {
  const range = resolveRevenuePeriodRange(
    period,
    referenceDate,
    customStart,
    customEnd,
  );
  return formatPdfPeriodLabel(range.startDate, range.endDate);
}

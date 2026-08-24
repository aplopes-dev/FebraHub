import { endOfMonth, format } from 'date-fns';
import {
  formatLocalDateString,
  parseLocalDateString,
} from '@/features/clinic/agenda/lib/local-date';

export function formatPdfPeriodLabel(
  startDate: string,
  endDate: string,
): string {
  const start = parseLocalDateString(startDate);
  const end = parseLocalDateString(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} a ${endDate}`;
  }

  if (formatLocalDateString(start) === formatLocalDateString(end)) {
    return format(start, 'dd/MM/yyyy');
  }

  const coversFullMonth =
    start.getDate() === 1 &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    formatLocalDateString(end) === formatLocalDateString(endOfMonth(start));

  if (coversFullMonth) {
    return format(start, 'MM/yyyy');
  }

  return `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`;
}

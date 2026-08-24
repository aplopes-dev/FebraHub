import type { WeekdayId, WorkInterval } from '@/lib/work-schedule';
import { parseIsoDate, timeToMinutes } from './agenda-date';

const ISO_WEEKDAY_TO_ID: WeekdayId[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export function weekdayIdFromIsoDate(isoDate: string): WeekdayId {
  return ISO_WEEKDAY_TO_ID[parseIsoDate(isoDate).getDay()];
}

/**
 * Slot horário [hour:00, hour+1:00) está dentro de algum intervalo de trabalho.
 * Dia sem intervalos = folga (nenhum slot disponível).
 */
export function isHourWithinWorkIntervals(
  hour: number,
  intervals: WorkInterval[],
): boolean {
  if (intervals.length === 0) return false;

  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;

  return intervals.some((interval) => {
    const start = timeToMinutes(interval.startTime);
    const end = timeToMinutes(interval.endTime);
    return start < slotEnd && end > slotStart;
  });
}

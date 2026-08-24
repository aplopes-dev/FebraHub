import type {
  WeekdayId,
  WorkInterval,
} from '../../../../shared/domain/work-schedule/work-schedule.types';
import { toTimeHm } from './appointment-datetime';

const DAY_INDEX_TO_WEEKDAY: WeekdayId[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export function weekdayIdFromDate(date: Date): WeekdayId {
  return DAY_INDEX_TO_WEEKDAY[date.getDay()];
}

export function timeHmToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * O intervalo [startAt, endAt) deve caber por completo em um único
 * intervalo de trabalho do dia (não atravessa almoço/folga).
 * Dia sem intervalos = folga. Faixas que cruzam meia-noite são rejeitadas.
 */
export function isRangeWithinWorkIntervals(
  startAt: Date,
  endAt: Date,
  intervals: WorkInterval[],
): boolean {
  if (intervals.length === 0) return false;
  if (endAt.getTime() <= startAt.getTime()) return false;
  if (
    startAt.getFullYear() !== endAt.getFullYear() ||
    startAt.getMonth() !== endAt.getMonth() ||
    startAt.getDate() !== endAt.getDate()
  ) {
    return false;
  }

  const rangeStart = timeHmToMinutes(toTimeHm(startAt));
  const rangeEnd = timeHmToMinutes(toTimeHm(endAt));

  return intervals.some((interval) => {
    const start = timeHmToMinutes(interval.startTime);
    const end = timeHmToMinutes(interval.endTime);
    return start <= rangeStart && end >= rangeEnd;
  });
}

export type OccupancyWindow = {
  professionalId: string;
  startAt: Date;
  endAt: Date;
};

/** Expande linhas sequenciais a partir de startAt em janelas por profissional. */
export function buildOccupancyWindows(
  appointmentStart: Date,
  lines: Array<{ professionalId: string; duration: number }>,
  addMinutesFn: (date: Date, minutes: number) => Date,
): OccupancyWindow[] {
  const windows: OccupancyWindow[] = [];
  let cursor = appointmentStart;
  for (const line of lines) {
    const startAt = cursor;
    const endAt = addMinutesFn(cursor, line.duration);
    windows.push({
      professionalId: line.professionalId,
      startAt,
      endAt,
    });
    cursor = endAt;
  }
  return windows;
}

export function windowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

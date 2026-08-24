import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';

/** Start of civil day as UTC midnight for `yyyy-MM-dd`. */
export function civilDayStartUtc(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
}

/** End of civil day as UTC end-of-day for `yyyy-MM-dd`. */
export function civilDayEndUtc(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T23:59:59.999Z`);
}

/** Inclusive range covering the last `months` months ending today (civil). */
export function resolveLastMonthsRange(
  now: Date,
  months: number,
): { startIsoDate: string; endIsoDate: string; startAt: Date; endAt: Date } {
  const endIsoDate = toIsoDateOnly(now);
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - months,
      now.getUTCDate(),
    ),
  );
  const startIsoDate = toIsoDateOnly(start);
  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

/** Inclusive civil month of `now`. */
export function resolveCurrentMonthRange(now: Date): {
  startIsoDate: string;
  endIsoDate: string;
  startAt: Date;
  endAt: Date;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startIsoDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const endIsoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return {
    startIsoDate,
    endIsoDate,
    startAt: civilDayStartUtc(startIsoDate),
    endAt: civilDayEndUtc(endIsoDate),
  };
}

export const OPEN_APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
] as const;

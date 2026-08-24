/**
 * Date-only calendar helpers for birthday windows (no UTC day drift).
 * Mirrors ERP `daysUntilNextBirthday` / `countUpcomingBirthdays` / birthday-period.
 */

export type BirthdayPeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'next_30_days'
  | 'last_30_days'
  | 'custom';

export type BirthdayPeriodRange = {
  startIsoDate: string;
  endIsoDate: string;
};

function toCivilParts(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function civilDateUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

export function parseIsoDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return civilDateUtc(year, month - 1, day);
}

export function toIsoDateOnlyUtc(date: Date): string {
  const { year, month, day } = toCivilParts(date);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeekMonday(date: Date): Date {
  const parts = toCivilParts(date);
  const civil = civilDateUtc(parts.year, parts.month, parts.day);
  const day = civil.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  return addUtcDays(civil, diff);
}

function endOfUtcWeekSunday(date: Date): Date {
  return addUtcDays(startOfUtcWeekMonday(date), 6);
}

function startOfUtcMonth(date: Date): Date {
  const { year, month } = toCivilParts(date);
  return civilDateUtc(year, month, 1);
}

function endOfUtcMonth(date: Date): Date {
  const { year, month } = toCivilParts(date);
  return civilDateUtc(year, month + 1, 0);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function toMonthDayKey(date: Date): string {
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

/**
 * Month/day keys represented by an inclusive civil-date range.
 * Feb 29 birthdays fall on Mar 1 in non-leap years.
 */
export function birthdayMonthDayKeysInRange(
  startIsoDate: string,
  endIsoDate: string,
): string[] {
  const start = parseIsoDateOnly(startIsoDate);
  const end = parseIsoDateOnly(endIsoDate);
  if (end < start) return [];

  const keys: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(start);
  const maxDays = 366;

  for (let index = 0; cursor <= end && index < maxDays; index += 1) {
    const key = toMonthDayKey(cursor);
    if (!seen.has(key)) {
      keys.push(key);
      seen.add(key);
    }

    if (
      key === '03-01' &&
      !isLeapYear(cursor.getUTCFullYear()) &&
      !seen.has('02-29')
    ) {
      keys.push('02-29');
      seen.add('02-29');
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

export function isBirthdayInRange(
  birthDate: Date,
  startIsoDate: string,
  endIsoDate: string,
): boolean {
  const keys = birthdayMonthDayKeysInRange(startIsoDate, endIsoDate);
  return keys.includes(toMonthDayKey(birthDate));
}

/** Days until next birthday (0 = today). Handles year wrap. */
export function daysUntilNextBirthday(
  birthDate: Date,
  referenceDate: Date,
): number {
  const birth = toCivilParts(birthDate);
  const ref = toCivilParts(referenceDate);

  const refCivil = civilDateUtc(ref.year, ref.month, ref.day);
  let next = civilDateUtc(ref.year, birth.month, birth.day);
  if (next < refCivil) {
    next = civilDateUtc(ref.year + 1, birth.month, birth.day);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - refCivil.getTime()) / msPerDay);
}

/** Days since last birthday (0 = today). Handles year wrap. */
export function daysSinceLastBirthday(
  birthDate: Date,
  referenceDate: Date,
): number {
  const birth = toCivilParts(birthDate);
  const ref = toCivilParts(referenceDate);

  const refCivil = civilDateUtc(ref.year, ref.month, ref.day);
  let last = civilDateUtc(ref.year, birth.month, birth.day);
  if (last > refCivil) {
    last = civilDateUtc(ref.year - 1, birth.month, birth.day);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((refCivil.getTime() - last.getTime()) / msPerDay);
}

export function calculateAgeYears(
  birthDate: Date,
  referenceDate: Date,
): number {
  const birth = toCivilParts(birthDate);
  const ref = toCivilParts(referenceDate);

  let age = ref.year - birth.year;
  if (
    ref.month < birth.month ||
    (ref.month === birth.month && ref.day < birth.day)
  ) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export function countUpcomingBirthdays(
  birthDates: Date[],
  todayIsoDate: string,
  withinDays = 30,
): number {
  const today = parseIsoDateOnly(todayIsoDate);
  return birthDates.filter((birthDate) => {
    const days = daysUntilNextBirthday(birthDate, today);
    return days >= 0 && days <= withinDays;
  }).length;
}

export function resolveBirthdayPeriodRange(
  period: BirthdayPeriod,
  todayIsoDate: string,
  customStartIsoDate?: string,
  customEndIsoDate?: string,
): BirthdayPeriodRange {
  const today = parseIsoDateOnly(todayIsoDate);

  switch (period) {
    case 'today':
      return { startIsoDate: todayIsoDate, endIsoDate: todayIsoDate };
    case 'this_week':
      return {
        startIsoDate: toIsoDateOnlyUtc(startOfUtcWeekMonday(today)),
        endIsoDate: toIsoDateOnlyUtc(endOfUtcWeekSunday(today)),
      };
    case 'this_month':
      return {
        startIsoDate: toIsoDateOnlyUtc(startOfUtcMonth(today)),
        endIsoDate: toIsoDateOnlyUtc(endOfUtcMonth(today)),
      };
    case 'last_30_days':
      return {
        startIsoDate: toIsoDateOnlyUtc(addUtcDays(today, -30)),
        endIsoDate: todayIsoDate,
      };
    case 'next_30_days':
      return {
        startIsoDate: todayIsoDate,
        endIsoDate: toIsoDateOnlyUtc(addUtcDays(today, 30)),
      };
    case 'custom': {
      if (!customStartIsoDate || !customEndIsoDate) {
        return { startIsoDate: todayIsoDate, endIsoDate: todayIsoDate };
      }
      return {
        startIsoDate: customStartIsoDate,
        endIsoDate: customEndIsoDate,
      };
    }
  }
}

export function isPastLookingBirthdayPeriod(
  period: BirthdayPeriod,
  range: BirthdayPeriodRange,
  todayIsoDate: string,
): boolean {
  if (period === 'last_30_days') return true;
  if (period !== 'custom') return false;
  return parseIsoDateOnly(range.endIsoDate) < parseIsoDateOnly(todayIsoDate);
}

export function buildBirthdayRelativeLabel(
  daysUntil: number,
  ageYears: number,
): string {
  if (daysUntil === 0) return `Hoje (${ageYears} anos)`;
  if (daysUntil === 1) return `Falta 1 dia (${ageYears} anos)`;
  return `Faltam ${daysUntil} dias (${ageYears} anos)`;
}

export function buildPastBirthdayRelativeLabel(
  daysSince: number,
  ageYears: number,
): string {
  if (daysSince === 0) return `Hoje (${ageYears} anos)`;
  if (daysSince === 1) return `Há 1 dia (${ageYears} anos)`;
  return `Há ${daysSince} dias (${ageYears} anos)`;
}

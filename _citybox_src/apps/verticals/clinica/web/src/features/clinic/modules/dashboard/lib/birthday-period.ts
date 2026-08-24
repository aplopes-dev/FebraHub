import {
  endOfMonth,
  startOfMonth,
  subDays,
} from 'date-fns';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { formatPdfPeriodLabel } from '@/features/clinic/lib/format-pdf-period-label';
import { resolveClinicWeekRange } from '@/features/clinic/lib/resolve-clinic-week-range';
import type {
  BirthdayListItem,
  BirthdayPeriodFilter,
  BirthdayPeriodRange,
  DashboardBirthdayPatient,
} from '../types/clinic-dashboard';
import {
  calculateLocalAge,
  daysSinceLastBirthday,
  daysUntilNextBirthday,
  parseLocalDateString,
} from './dashboard-dates';

export const BIRTHDAY_PERIOD_OPTIONS: {
  value: BirthdayPeriodFilter;
  label: string;
}[] = [
  { value: 'today', label: 'de hoje' },
  { value: 'this_week', label: 'dessa semana' },
  { value: 'this_month', label: 'desse mês' },
  { value: 'last_30_days', label: 'dos últimos 30 dias' },
  { value: 'next_30_days', label: 'dos próximos 30 dias' },
  { value: 'custom', label: 'escolher período' },
];

export function formatBirthdayPdfPeriodLabel(
  period: BirthdayPeriodFilter,
  referenceDate: Date = new Date(),
  customStart?: Date,
  customEnd?: Date,
): string {
  const range = resolveBirthdayPeriodRange(
    period,
    referenceDate,
    customStart,
    customEnd,
  );
  return formatPdfPeriodLabel(range.startDate, range.endDate);
}

export function resolveBirthdayPeriodRange(
  period: BirthdayPeriodFilter,
  referenceDate: Date = new Date(),
  customStart?: Date,
  customEnd?: Date,
): BirthdayPeriodRange {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const fmt = formatLocalDateString;

  switch (period) {
    case 'today':
      return { startDate: fmt(today), endDate: fmt(today) };
    case 'this_week':
      return resolveClinicWeekRange(today);
    case 'this_month':
      return {
        startDate: fmt(startOfMonth(today)),
        endDate: fmt(endOfMonth(today)),
      };
    case 'last_30_days':
      return {
        startDate: fmt(subDays(today, 30)),
        endDate: fmt(today),
      };
    case 'next_30_days':
      return {
        startDate: fmt(today),
        endDate: fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)),
      };
    case 'custom':
      if (customStart && customEnd) {
        return { startDate: fmt(customStart), endDate: fmt(customEnd) };
      }
      return { startDate: fmt(today), endDate: fmt(today) };
  }
}

function birthdayOccurrenceInYear(
  birthDate: string,
  year: number,
): Date | null {
  const birth = parseLocalDateString(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  return new Date(year, birth.getMonth(), birth.getDate());
}

/**
 * Verifica se o aniversário (mês/dia) cai em algum dia do intervalo [start, end]
 * (datas civis locais inclusivas). Cobre virada de ano.
 */
export function isBirthdayInDateRange(
  birthDate: string,
  range: BirthdayPeriodRange,
): boolean {
  const start = parseLocalDateString(range.startDate);
  const end = parseLocalDateString(range.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (end < start) return false;

  const years = new Set([start.getFullYear(), end.getFullYear()]);
  for (const year of years) {
    const occurrence = birthdayOccurrenceInYear(birthDate, year);
    if (!occurrence) continue;
    if (occurrence >= start && occurrence <= end) return true;
  }

  return false;
}

export function buildBirthdayRelativeLabel(
  daysUntil: number,
  ageYears: number,
): string {
  if (daysUntil === 0) {
    return `Hoje (${ageYears} anos)`;
  }
  if (daysUntil === 1) {
    return `Falta 1 dia (${ageYears} anos)`;
  }
  return `Faltam ${daysUntil} dias (${ageYears} anos)`;
}

export function buildPastBirthdayRelativeLabel(
  daysSince: number,
  ageYears: number,
): string {
  if (daysSince === 0) {
    return `Hoje (${ageYears} anos)`;
  }
  if (daysSince === 1) {
    return `Há 1 dia (${ageYears} anos)`;
  }
  return `Há ${daysSince} dias (${ageYears} anos)`;
}

export function filterBirthdayPatients(params: {
  patients: DashboardBirthdayPatient[];
  period: BirthdayPeriodFilter;
  referenceDate?: Date;
  customStart?: Date;
  customEnd?: Date;
  /** Busca por nome ou telefone (fixtures/mock nesta fase). */
  search?: string;
  /** Somente ativos (padrão do produto). */
  activeOnly?: boolean;
}): BirthdayListItem[] {
  const referenceDate = params.referenceDate ?? new Date();
  const activeOnly = params.activeOnly ?? true;
  const search = params.search?.trim().toLowerCase() ?? '';
  const range = resolveBirthdayPeriodRange(
    params.period,
    referenceDate,
    params.customStart,
    params.customEnd,
  );

  const isPastLooking =
    params.period === 'last_30_days' ||
    (params.period === 'custom' &&
      parseLocalDateString(range.endDate) <
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate(),
        ));

  const items: BirthdayListItem[] = [];

  for (const patient of params.patients) {
    if (activeOnly && patient.status !== 'active') continue;
    if (!patient.birthDate.trim()) continue;
    if (!isBirthdayInDateRange(patient.birthDate, range)) continue;
    if (
      search &&
      !patient.name.toLowerCase().includes(search) &&
      !patient.phone.includes(search)
    ) {
      continue;
    }

    const ageYears = calculateLocalAge(patient.birthDate, referenceDate);
    const daysUntil = daysUntilNextBirthday(patient.birthDate, referenceDate) ?? 0;
    const daysSince = daysSinceLastBirthday(patient.birthDate, referenceDate) ?? 0;

    const relativeLabel = isPastLooking
      ? buildPastBirthdayRelativeLabel(daysSince, ageYears)
      : buildBirthdayRelativeLabel(daysUntil, ageYears);

    items.push({
      ...patient,
      ageYears,
      daysUntil: isPastLooking ? -daysSince : daysUntil,
      relativeLabel,
    });
  }

  return items.sort((a, b) => {
    if (isPastLooking) {
      return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
    }
    return a.daysUntil - b.daysUntil;
  });
}

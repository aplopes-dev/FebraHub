import type {
  PosCashPeriod,
  PosCashPeriodPreset,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

export const POS_CASH_PERIOD_ORDER: PosCashPeriodPreset[] = [
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "custom",
];

export const POS_CASH_PERIOD_LABELS: Record<PosCashPeriodPreset, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  this_week: "Essa semana",
  this_month: "Esse mês",
  custom: "Data específica",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, mondayOffset));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export type PosCashDateRange = {
  from: Date;
  to: Date;
};

export function resolvePosCashPeriodRange(
  period: PosCashPeriod,
  now: Date = new Date(),
): PosCashDateRange | null {
  const today = startOfDay(now);

  switch (period.preset) {
    case "today":
      return { from: today, to: endOfDay(today) };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }
    case "this_week":
      return { from: startOfWeek(today), to: endOfDay(today) };
    case "this_month":
      return { from: startOfMonth(today), to: endOfDay(today) };
    case "custom": {
      const fromDate = period.customFrom
        ? parseIsoDate(period.customFrom)
        : null;
      const toDate = period.customTo ? parseIsoDate(period.customTo) : null;
      if (!fromDate && !toDate) return null;
      const from = startOfDay(fromDate ?? toDate!);
      const to = endOfDay(toDate ?? fromDate!);
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: startOfDay(to), to: endOfDay(from) };
    }
    default:
      return null;
  }
}

export function isOpenedAtInPeriod(
  openedAt: string,
  period: PosCashPeriod,
  now: Date = new Date(),
): boolean {
  const range = resolvePosCashPeriodRange(period, now);
  if (!range) return true;
  const opened = new Date(openedAt);
  if (Number.isNaN(opened.getTime())) return false;
  return (
    opened.getTime() >= range.from.getTime() &&
    opened.getTime() <= range.to.getTime()
  );
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

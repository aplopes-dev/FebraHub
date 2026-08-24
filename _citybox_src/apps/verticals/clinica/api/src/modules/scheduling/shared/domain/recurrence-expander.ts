import type {
  InternalEventAvailability,
  InternalEventPrivacy,
  RecurrenceEnd,
  RecurrenceType,
} from './scheduling-enums';

export type RecurrenceRule = {
  id: string;
  professionalId: string;
  title: string;
  description: string | null;
  allDay: boolean;
  startAt: Date;
  endAt: Date;
  recurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEnd: RecurrenceEnd | null;
  recurrenceEndDate: Date | null;
  availability: InternalEventAvailability;
  privacy: InternalEventPrivacy;
};

export type ExpandedInternalEventOccurrence = {
  id: string;
  occurrenceKey: string;
  professionalId: string;
  title: string;
  description: string | null;
  allDay: boolean;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEnd: RecurrenceEnd | null;
  recurrenceEndDate: string | null;
  availability: InternalEventAvailability;
  privacy: InternalEventPrivacy;
};

function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

function isAfterRecurrenceEnd(
  occurrenceStart: Date,
  rule: RecurrenceRule,
): boolean {
  if (!rule.recurring || rule.recurrenceEnd !== 'on_date') return false;
  if (!rule.recurrenceEndDate) return false;
  return occurrenceStart > endOfDay(rule.recurrenceEndDate);
}

function buildOccurrence(
  rule: RecurrenceRule,
  occurrenceStart: Date,
  occurrenceEnd: Date,
  index: number,
): ExpandedInternalEventOccurrence {
  return {
    id: rule.id,
    occurrenceKey: `${rule.id}:${occurrenceStart.toISOString()}`,
    professionalId: rule.professionalId,
    title: rule.title,
    description: rule.description,
    allDay: rule.allDay,
    startDate: occurrenceStart.toISOString(),
    endDate: occurrenceEnd.toISOString(),
    recurring: rule.recurring,
    recurrenceType: rule.recurrenceType,
    recurrenceEnd: rule.recurrenceEnd,
    recurrenceEndDate: rule.recurrenceEndDate
      ? rule.recurrenceEndDate.toISOString().slice(0, 10)
      : null,
    availability: rule.availability,
    privacy: rule.privacy,
    ...(index > 0 ? {} : {}),
  };
}

function overlapsRange(
  occurrenceStart: Date,
  occurrenceEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return occurrenceStart <= rangeEnd && occurrenceEnd >= rangeStart;
}

function nextOccurrenceStart(
  current: Date,
  recurrenceType: RecurrenceType,
): Date {
  switch (recurrenceType) {
    case 'daily':
      return addDays(current, 1);
    case 'weekly':
      return addDays(current, 7);
    case 'biweekly':
      return addDays(current, 14);
    case 'monthly':
      return addMonths(current, 1);
    case 'yearly':
      return addYears(current, 1);
    default:
      return addDays(current, 1);
  }
}

export function expandInternalEvent(
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences = 500,
): ExpandedInternalEventOccurrence[] {
  const durationMs = rule.endAt.getTime() - rule.startAt.getTime();
  const occurrences: ExpandedInternalEventOccurrence[] = [];

  if (!rule.recurring || !rule.recurrenceType) {
    if (overlapsRange(rule.startAt, rule.endAt, rangeStart, rangeEnd)) {
      occurrences.push(buildOccurrence(rule, rule.startAt, rule.endAt, 0));
    }
    return occurrences;
  }

  let currentStart = new Date(rule.startAt);
  let index = 0;

  while (
    index < maxOccurrences &&
    currentStart <= rangeEnd &&
    !isAfterRecurrenceEnd(currentStart, rule)
  ) {
    const currentEnd = new Date(currentStart.getTime() + durationMs);
    if (overlapsRange(currentStart, currentEnd, rangeStart, rangeEnd)) {
      occurrences.push(buildOccurrence(rule, currentStart, currentEnd, index));
    }
    currentStart = nextOccurrenceStart(currentStart, rule.recurrenceType);
    index += 1;
    if (currentStart < startOfDay(rule.startAt)) break;
  }

  return occurrences;
}

export function expandInternalEvents(
  rules: RecurrenceRule[],
  rangeStart: Date,
  rangeEnd: Date,
): ExpandedInternalEventOccurrence[] {
  return rules.flatMap((rule) =>
    expandInternalEvent(rule, rangeStart, rangeEnd),
  );
}

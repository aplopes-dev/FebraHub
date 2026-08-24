import type { ExpandedInternalEventOccurrence } from './recurrence-expander';
import { parseClinicDateTime } from './clinic-datetime.utils';
import { rangesOverlap } from './time-range.utils';

export type DateTimeRange = {
  startAt: Date;
  endAt: Date;
};

const DEFAULT_TIMED_COMMITMENT_MS = 60 * 60_000;

function ensureTimedEndAfterStart(startAt: Date, endAt: Date): Date {
  if (endAt.getTime() > startAt.getTime()) {
    return endAt;
  }
  return new Date(startAt.getTime() + DEFAULT_TIMED_COMMITMENT_MS);
}

/** Normaliza intervalo de compromisso — dia todo cobre 00:00:00 até 23:59:59.999 UTC. */
export function normalizeInternalEventRange(input: {
  allDay: boolean;
  startDate: string;
  endDate: string;
}): DateTimeRange {
  if (!input.allDay) {
    const startAt = parseClinicDateTime(input.startDate);
    const endAt = ensureTimedEndAfterStart(
      startAt,
      parseClinicDateTime(input.endDate),
    );
    return { startAt, endAt };
  }

  const startDay = input.startDate.slice(0, 10);
  const endDay = input.endDate.slice(0, 10);

  return {
    startAt: new Date(`${startDay}T00:00:00.000Z`),
    endAt: new Date(`${endDay}T23:59:59.999Z`),
  };
}

export function dayBoundsUtc(date: string): DateTimeRange {
  return {
    startAt: new Date(`${date}T00:00:00.000Z`),
    endAt: new Date(`${date}T23:59:59.999Z`),
  };
}

/**
 * Converte ocorrência de compromisso em intervalo ocupado no dia consultado.
 * Todo compromisso bloqueia consultas no intervalo — all-day cobre o dia inteiro.
 */
export function busyExpandedEventToOccupiedOnDate(
  event: ExpandedInternalEventOccurrence,
  date: string,
): DateTimeRange | null {
  if (event.allDay) {
    const startDay = event.startDate.slice(0, 10);
    const endDay = event.endDate.slice(0, 10);
    if (date < startDay || date > endDay) {
      return null;
    }
    return dayBoundsUtc(date);
  }

  const startAt = new Date(event.startDate);
  const endAt = ensureTimedEndAfterStart(startAt, new Date(event.endDate));
  const { startAt: dayStart, endAt: dayEnd } = dayBoundsUtc(date);

  if (startAt > dayEnd || endAt < dayStart) {
    return null;
  }

  return { startAt, endAt };
}

/** Verifica se um compromisso impede agendar consulta no intervalo informado. */
export function busyExpandedEventBlocksRange(
  event: ExpandedInternalEventOccurrence,
  slotStart: Date,
  slotEnd: Date,
): boolean {
  const date = slotStart.toISOString().slice(0, 10);
  const occupied = busyExpandedEventToOccupiedOnDate(event, date);
  if (!occupied) {
    return false;
  }

  return rangesOverlap(slotStart, slotEnd, occupied.startAt, occupied.endAt);
}

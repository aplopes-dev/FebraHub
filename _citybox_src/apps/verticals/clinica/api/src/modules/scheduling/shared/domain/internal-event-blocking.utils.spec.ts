import {
  busyExpandedEventBlocksRange,
  normalizeInternalEventRange,
} from './internal-event-blocking.utils';
import type { ExpandedInternalEventOccurrence } from './recurrence-expander';

function buildAllDayEvent(
  startDay: string,
  endDay = startDay,
): ExpandedInternalEventOccurrence {
  return {
    id: 'evt-1',
    occurrenceKey: 'evt-1:1',
    professionalId: 'pro-1',
    title: 'Férias',
    description: null,
    allDay: true,
    startDate: `${startDay}T00:00:00.000Z`,
    endDate: `${endDay}T00:00:00.000Z`,
    recurring: false,
    recurrenceType: null,
    recurrenceEnd: null,
    recurrenceEndDate: null,
    availability: 'busy',
    privacy: 'public',
  };
}

describe('internal-event-blocking.utils', () => {
  it('normaliza compromisso dia todo para cobrir o dia inteiro', () => {
    const range = normalizeInternalEventRange({
      allDay: true,
      startDate: '2026-07-10T00:00:00',
      endDate: '2026-07-10T00:00:00',
    });

    expect(range.startAt.toISOString()).toBe('2026-07-10T00:00:00.000Z');
    expect(range.endAt.toISOString()).toBe('2026-07-10T23:59:59.999Z');
  });

  it('bloqueia consulta em dia com compromisso all-day busy', () => {
    const event = buildAllDayEvent('2026-07-10');
    const slotStart = new Date('2026-07-10T14:00:00.000Z');
    const slotEnd = new Date('2026-07-10T14:30:00.000Z');

    expect(busyExpandedEventBlocksRange(event, slotStart, slotEnd)).toBe(true);
  });

  it('bloqueia consulta mesmo quando availability é available', () => {
    const event = {
      ...buildAllDayEvent('2026-07-10'),
      availability: 'available' as const,
    };
    const slotStart = new Date('2026-07-10T14:00:00.000Z');
    const slotEnd = new Date('2026-07-10T14:30:00.000Z');

    expect(busyExpandedEventBlocksRange(event, slotStart, slotEnd)).toBe(true);
  });

  it('bloqueia consulta no horário do compromisso com duração definida', () => {
    const event: ExpandedInternalEventOccurrence = {
      ...buildAllDayEvent('2026-07-10'),
      allDay: false,
      startDate: '2026-07-10T10:00:00.000Z',
      endDate: '2026-07-10T11:00:00.000Z',
      title: 'Reunião',
    };
    const overlapping = new Date('2026-07-10T10:30:00.000Z');
    const overlappingEnd = new Date('2026-07-10T11:00:00.000Z');
    const afterCommitment = new Date('2026-07-10T11:00:00.000Z');
    const afterCommitmentEnd = new Date('2026-07-10T11:30:00.000Z');

    expect(
      busyExpandedEventBlocksRange(event, overlapping, overlappingEnd),
    ).toBe(true);
    expect(
      busyExpandedEventBlocksRange(event, afterCommitment, afterCommitmentEnd),
    ).toBe(false);
  });

  it('normaliza compromisso com horário sem duração para 1 hora', () => {
    const range = normalizeInternalEventRange({
      allDay: false,
      startDate: '2026-07-10T10:00:00',
      endDate: '2026-07-10T10:00:00',
    });

    expect(range.startAt.toISOString()).toBe('2026-07-10T10:00:00.000Z');
    expect(range.endAt.toISOString()).toBe('2026-07-10T11:00:00.000Z');
  });

  it('bloqueia slots entre 08:00 e 11:00 quando compromisso cobre esse intervalo', () => {
    const event: ExpandedInternalEventOccurrence = {
      ...buildAllDayEvent('2026-07-09'),
      allDay: false,
      startDate: '2026-07-09T08:00:00.000Z',
      endDate: '2026-07-09T11:00:00.000Z',
      title: 'Compromisso manhã',
    };
    const slotAtEight = new Date('2026-07-09T08:00:00.000Z');
    const slotAtEightEnd = new Date('2026-07-09T08:30:00.000Z');
    const slotAtEleven = new Date('2026-07-09T11:00:00.000Z');
    const slotAtElevenEnd = new Date('2026-07-09T11:30:00.000Z');

    expect(
      busyExpandedEventBlocksRange(event, slotAtEight, slotAtEightEnd),
    ).toBe(true);
    expect(
      busyExpandedEventBlocksRange(event, slotAtEleven, slotAtElevenEnd),
    ).toBe(false);
  });
});

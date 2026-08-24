import { DEFAULT_SERVICE_HOURS } from '../../../team-service-hours/domain/service-hours.types';
import { calculateAvailableSlots } from './available-slots-calculator';

describe('available-slots-calculator', () => {
  const monday = '2026-07-06';
  /** Instantâneo anterior às datas dos fixtures (evita filtro de “já passou”). */
  const beforeSchedule = new Date('2026-07-01T12:00:00.000Z');

  it('returns empty slots when weekday is disabled', () => {
    const result = calculateAvailableSlots({
      date: '2026-07-05',
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [],
      now: beforeSchedule,
    });

    expect(result.workingWindow).toBeNull();
    expect(result.slots).toHaveLength(0);
  });

  it('marks occupied appointment slots as unavailable', () => {
    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [
        {
          startAt: new Date(`${monday}T09:00:00.000Z`),
          endAt: new Date(`${monday}T09:30:00.000Z`),
        },
      ],
      busyEvents: [],
      slotStepMin: 30,
      now: beforeSchedule,
    });

    const nineAm = result.slots.find((slot) => slot.startTime === '09:00');
    expect(nineAm?.available).toBe(false);
  });

  it('blocks slots from busy internal events', () => {
    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [
        {
          id: 'evt-1',
          occurrenceKey: 'evt-1:1',
          professionalId: 'pro-1',
          title: 'Compromisso',
          description: null,
          allDay: false,
          startDate: `${monday}T10:00:00.000Z`,
          endDate: `${monday}T11:00:00.000Z`,
          recurring: false,
          recurrenceType: null,
          recurrenceEnd: null,
          recurrenceEndDate: null,
          availability: 'busy',
          privacy: 'public',
        },
      ],
      slotStepMin: 30,
      now: beforeSchedule,
    });

    const tenAm = result.slots.find((slot) => slot.startTime === '10:00');
    expect(tenAm?.available).toBe(false);
  });

  it('blocks all slots for legacy all-day event with zero duration', () => {
    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [
        {
          id: 'evt-all-day',
          occurrenceKey: 'evt-all-day:1',
          professionalId: 'pro-1',
          title: 'Congresso',
          description: null,
          allDay: true,
          startDate: `${monday}T00:00:00.000Z`,
          endDate: `${monday}T00:00:00.000Z`,
          recurring: false,
          recurrenceType: null,
          recurrenceEnd: null,
          recurrenceEndDate: null,
          availability: 'busy',
          privacy: 'public',
        },
      ],
      slotStepMin: 30,
      now: beforeSchedule,
    });

    expect(result.slots.every((slot) => slot.available === false)).toBe(true);
  });

  it('blocks slots between 08:00 and 11:00 for timed commitment', () => {
    const result = calculateAvailableSlots({
      date: '2026-07-09',
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [
        {
          id: 'evt-morning',
          occurrenceKey: 'evt-morning:1',
          professionalId: 'pro-1',
          title: 'Compromisso',
          description: null,
          allDay: false,
          startDate: '2026-07-09T08:00:00.000Z',
          endDate: '2026-07-09T11:00:00.000Z',
          recurring: false,
          recurrenceType: null,
          recurrenceEnd: null,
          recurrenceEndDate: null,
          availability: 'busy',
          privacy: 'public',
        },
      ],
      slotStepMin: 30,
      now: beforeSchedule,
    });

    expect(
      result.slots.find((slot) => slot.startTime === '08:00')?.available,
    ).toBe(false);
    expect(
      result.slots.find((slot) => slot.startTime === '10:30')?.available,
    ).toBe(false);
    expect(
      result.slots.find((slot) => slot.startTime === '11:00')?.available,
    ).toBe(true);
  });

  it('uses durationMin as step by default (avoid overlapping start times)', () => {
    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [],
      now: beforeSchedule,
    });

    expect(
      result.slots.find((slot) => slot.startTime === '08:15'),
    ).toBeUndefined();
    expect(
      result.slots.find((slot) => slot.startTime === '08:30'),
    ).toBeDefined();
  });

  it('marks past slots as unavailable when date is today (clinic wall-clock)', () => {
    // 16:00 BRT = 19:00 UTC (America/Sao_Paulo, UTC−3)
    const now = new Date('2026-07-06T19:00:00.000Z');

    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [],
      slotStepMin: 30,
      now,
    });

    expect(
      result.slots.find((slot) => slot.startTime === '09:00')?.available,
    ).toBe(false);
    expect(
      result.slots.find((slot) => slot.startTime === '15:30')?.available,
    ).toBe(false);
    expect(
      result.slots.find((slot) => slot.startTime === '16:00')?.available,
    ).toBe(false);
    expect(
      result.slots.find((slot) => slot.startTime === '16:30')?.available,
    ).toBe(true);
  });

  it('marks all slots unavailable when date is before today', () => {
    const now = new Date('2026-07-07T12:00:00.000Z');

    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [],
      slotStepMin: 30,
      now,
    });

    expect(result.slots.every((slot) => slot.available === false)).toBe(true);
  });

  it('keeps future-day slots available regardless of clock time', () => {
    const now = new Date('2026-07-05T19:00:00.000Z');

    const result = calculateAvailableSlots({
      date: monday,
      durationMin: 30,
      clinicOpeningTime: '08:00',
      clinicClosingTime: '18:00',
      serviceHours: DEFAULT_SERVICE_HOURS,
      appointments: [],
      busyEvents: [],
      slotStepMin: 30,
      now,
    });

    expect(
      result.slots.find((slot) => slot.startTime === '09:00')?.available,
    ).toBe(true);
  });
});

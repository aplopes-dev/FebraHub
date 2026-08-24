import type { ServiceHoursConfig } from '../../../team-service-hours/domain/service-hours.types';
import { WEEKDAY_IDS } from '../../../team-service-hours/domain/service-hours.types';
import type { ExpandedInternalEventOccurrence } from './recurrence-expander';
import { busyExpandedEventToOccupiedOnDate } from './internal-event-blocking.utils';
import type { AppointmentStatus } from './appointment-types';
import { BLOCKING_APPOINTMENT_STATUSES } from './appointment-types';
import { getClinicWallClockParts } from './clinic-datetime.utils';
import {
  formatMinutesToTime,
  intersectTimeWindows,
  parseTimeToMinutes,
  rangesOverlap,
  subtractInterval,
  type TimeWindow,
} from './time-range.utils';

export type OccupiedInterval = {
  startAt: Date;
  endAt: Date;
};

export type AvailableSlotsInput = {
  date: string;
  durationMin: number;
  clinicOpeningTime: string;
  clinicClosingTime: string;
  serviceHours: ServiceHoursConfig;
  appointments: OccupiedInterval[];
  blockingStatuses?: AppointmentStatus[];
  busyEvents: ExpandedInternalEventOccurrence[];
  slotStepMin?: number;
  /** Instantâneo “agora”; default `new Date()`. Usado para ocultar horários já passados. */
  now?: Date;
};

export type AvailableSlotItem = {
  startTime: string;
  endTime: string;
  available: boolean;
};

export type AvailableSlotsResult = {
  date: string;
  durationMin: number;
  workingWindow: { startTime: string; endTime: string } | null;
  slots: AvailableSlotItem[];
};

function weekdayIdFromDate(dateStr: string): (typeof WEEKDAY_IDS)[number] {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  return map[day];
}

function dateAtMinutes(dateStr: string, minutes: number): Date {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(
    `${dateStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000Z`,
  );
}

export function calculateAvailableSlots(
  input: AvailableSlotsInput,
): AvailableSlotsResult {
  const {
    date,
    durationMin,
    clinicOpeningTime,
    clinicClosingTime,
    serviceHours,
    appointments,
    busyEvents,
  } = input;

  // Por padrão, evitamos sugerir startTimes intermediários que geram
  // slots sobrepostos na própria lista (ex.: duração 30 -> step 30).
  const step = Math.max(15, input.slotStepMin ?? durationMin);
  const weekdayId = weekdayIdFromDate(date);
  const daySchedule = serviceHours.weekSchedule[weekdayId];

  if (!daySchedule.enabled) {
    return {
      date,
      durationMin,
      workingWindow: null,
      slots: [],
    };
  }

  const clinicWindow: TimeWindow = {
    startMinutes: parseTimeToMinutes(clinicOpeningTime),
    endMinutes: parseTimeToMinutes(clinicClosingTime),
  };
  const professionalWindow: TimeWindow = {
    startMinutes: parseTimeToMinutes(daySchedule.startTime),
    endMinutes: parseTimeToMinutes(daySchedule.endTime),
  };

  let workingWindow = intersectTimeWindows(clinicWindow, professionalWindow);
  if (!workingWindow) {
    return {
      date,
      durationMin,
      workingWindow: null,
      slots: [],
    };
  }

  if (serviceHours.fixedLunchBreak.enabled) {
    const lunchWindow: TimeWindow = {
      startMinutes: parseTimeToMinutes(serviceHours.fixedLunchBreak.startTime),
      endMinutes: parseTimeToMinutes(serviceHours.fixedLunchBreak.endTime),
    };
    const parts = subtractInterval(workingWindow, lunchWindow);
    workingWindow = parts[0] ?? null;
    if (!workingWindow) {
      return {
        date,
        durationMin,
        workingWindow: null,
        slots: [],
      };
    }
  }

  const occupied: OccupiedInterval[] = [
    ...appointments,
    ...busyEvents
      .map((event) => busyExpandedEventToOccupiedOnDate(event, date))
      .filter((interval): interval is OccupiedInterval => interval !== null),
  ];

  const wallClock = getClinicWallClockParts(input.now ?? new Date());
  const isPastDay = date < wallClock.date;
  const isToday = date === wallClock.date;

  const slots: AvailableSlotItem[] = [];
  for (
    let cursor = workingWindow.startMinutes;
    cursor + durationMin <= workingWindow.endMinutes;
    cursor += step
  ) {
    const slotStart = dateAtMinutes(date, cursor);
    const slotEnd = dateAtMinutes(date, cursor + durationMin);
    const occupiedConflict = occupied.some((interval) =>
      rangesOverlap(slotStart, slotEnd, interval.startAt, interval.endAt),
    );
    const isPastSlot =
      isPastDay || (isToday && cursor <= wallClock.minutes);
    const available = !occupiedConflict && !isPastSlot;

    slots.push({
      startTime: formatMinutesToTime(cursor),
      endTime: formatMinutesToTime(cursor + durationMin),
      available,
    });
  }

  return {
    date,
    durationMin,
    workingWindow: {
      startTime: formatMinutesToTime(workingWindow.startMinutes),
      endTime: formatMinutesToTime(workingWindow.endMinutes),
    },
    slots,
  };
}

export function isBlockingAppointmentStatus(
  status: AppointmentStatus,
): boolean {
  return BLOCKING_APPOINTMENT_STATUSES.includes(status);
}

import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameWeek,
  isSameDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  differenceInMinutes,
  eachDayOfInterval,
  startOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isSameYear,
  isWithinInterval,
} from "date-fns";

import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import {
  formatClinicDateFromIso,
  parseClinicDateTimeIso,
} from "@/features/clinic/agenda/lib/clinic-datetime";

import type { ICalendarCell, IEvent } from "./interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours } from "./types";

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
  const formatString = "d 'de' MMM 'de' yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "agenda":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "week":
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
      break;
    case "day":
      return format(date, formatString, { locale: dateLocale });
    default:
      return "Erro ao formatar";
  }

  return `${format(start, formatString, { locale: dateLocale })} - ${format(end, formatString, { locale: dateLocale })}`;
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: "previous" | "next"
): Date {
  const operations = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return operations[view](date, 1);
}

export function getEventsCount(
  events: IEvent[],
  date: Date,
  view: TCalendarView
): number {
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  };

  return events.filter((event) =>
    compareFns[view](parseClinicDateTimeIso(event.startDate), date)
  ).length;
}

// ================ Week and day view helper functions ================ //

export function parseClinicTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes ?? 0);
}

/** Hora inclusive no eixo do calendário (ex.: fechamento 18:00 → linha das 18:00 visível). */
export function displayEndHourFromClosingMinutes(toMinutes: number): number {
  return Math.floor(toMinutes / 60);
}

/** Altura lógica da grade (em minutos) alinhada às linhas renderizadas e ao fechamento. */
export function getCalendarGridSpanMinutes(
  fromMinutes: number,
  hours: number[],
  toMinutes: number,
): number {
  if (hours.length === 0) {
    return Math.max(toMinutes - fromMinutes, 0);
  }

  const lastHourEndMinutes = (hours[hours.length - 1] + 1) * 60;
  return Math.min(lastHourEndMinutes, toMinutes) - fromMinutes;
}

/** Espaço abaixo do fechamento quando a última linha da grade passa do horário configurado. */
export function getClosingFooterHeightPx(
  fromMinutes: number,
  hours: number[],
  toMinutes: number,
): number {
  if (hours.length === 0) return 0;

  const rowsHeightPx = hours.length * 96;
  const gridSpanMinutes = getCalendarGridSpanMinutes(fromMinutes, hours, toMinutes);
  const gridHeightPx = (gridSpanMinutes / 60) * 96;

  return Math.max(rowsHeightPx - gridHeightPx, 0);
}

export function formatClosingTimeLabel(toMinutes: number): string {
  const hours = Math.floor(toMinutes / 60);
  const minutes = toMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isWorkingTimeSlot(
  hour: number,
  minute: number,
  fromMinutes: number,
  toMinutes: number
): boolean {
  const slotStart = hour * 60 + minute;
  return slotStart >= fromMinutes && slotStart < toMinutes;
}

export function getCurrentEvents(events: IEvent[]) {
  const now = new Date();
  return (
    events.filter((event) =>
      isWithinInterval(now, {
        start: parseClinicDateTimeIso(event.startDate),
        end: parseClinicDateTimeIso(event.endDate),
      })
    ) || null
  );
}

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort(
    (a, b) =>
      parseClinicDateTimeIso(a.startDate).getTime() -
      parseClinicDateTimeIso(b.startDate).getTime()
  );
  const groups: IEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = parseClinicDateTimeIso(event.startDate);

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = parseClinicDateTimeIso(lastEventInGroup.endDate);

      if (eventStart >= lastEventEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: {
    from: number;
    to: number;
    fromMinutes?: number;
    toMinutes?: number;
    gridSpanMinutes?: number;
  }
) {
  const startDate = parseClinicDateTimeIso(event.startDate);
  const dayStart = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    0,
    0,
    0,
    0
  );
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = differenceInMinutes(eventStart, dayStart);

  let top;

  if (visibleHoursRange) {
    const visibleStartMinutes =
      visibleHoursRange.fromMinutes ?? visibleHoursRange.from * 60;
    const visibleEndMinutes =
      visibleHoursRange.toMinutes ?? visibleHoursRange.to * 60;
    const gridSpanMinutes =
      visibleHoursRange.gridSpanMinutes ??
      Math.max(visibleEndMinutes - visibleStartMinutes, 1);
    top = ((startMinutes - visibleStartMinutes) / gridSpanMinutes) * 100;
  } else {
    top = (startMinutes / 1440) * 100;
  }

  const width = 100 / groupSize;
  const left = groupIndex * width;

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(
  day: Date,
  hour: number,
  workingHours: TWorkingHours
) {
  const dayIndex = day.getDay() as keyof typeof workingHours;
  const dayHours = workingHours[dayIndex];
  return hour >= dayHours.from && hour < dayHours.to;
}

/**
 * Retorna os commitments que afetam um dia específico.
 * Para all-day commitments, compara os strings de data (YYYY-MM-DD) para evitar
 * problemas de timezone ao comparar com datas UTC do backend.
 */
export function getCommitmentsForDay(commitments: IEvent[], day: Date): IEvent[] {
  const dayStr = format(day, "yyyy-MM-dd");
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

  return commitments.filter((c) => {
    if (c.rawCommitment?.allDay) {
      // Para all-day commitments, usamos os strings de data brutos para evitar timezone shift
      const cStartStr = formatClinicDateFromIso(c.rawCommitment.startDate as string);
      const cEndStr = formatClinicDateFromIso(c.rawCommitment.endDate as string);
      return dayStr >= cStartStr && dayStr <= cEndStr;
    }
    // Para commitments com horário, usa comparação local
    const cStart = parseClinicDateTimeIso(c.startDate);
    const cEnd = parseClinicDateTimeIso(c.endDate);
    return cStart < dayEnd && cEnd > dayStart;
  });
}

/**
 * Calcula a posição e altura de um commitment no grid de tempo (em pixels).
 * All-day commitments cobrem toda a altura visível do grid.
 */
export function getCommitmentBlockStyle(
  commitment: IEvent,
  day: Date,
  visibleHoursRange: {
    from: number;
    to: number;
    fromMinutes?: number;
    toMinutes?: number;
    gridSpanMinutes?: number;
  }
): { top: string; heightPx: number } {
  if (commitment.rawCommitment?.allDay) {
    const fromMinutes =
      visibleHoursRange.fromMinutes ?? visibleHoursRange.from * 60;
    const toMinutes =
      visibleHoursRange.toMinutes ?? visibleHoursRange.to * 60;
    const gridSpanMinutes =
      visibleHoursRange.gridSpanMinutes ??
      Math.max(toMinutes - fromMinutes, 0);
    const heightPx = (gridSpanMinutes / 60) * 96;
    return { top: "0%", heightPx };
  }

  const dayStart = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    0,
    0,
    0,
    0
  );
  const cStart = parseClinicDateTimeIso(commitment.startDate);
  const cEnd = parseClinicDateTimeIso(commitment.endDate);

  const clampedStart = cStart < dayStart ? dayStart : cStart;
  const dayEnd = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    23,
    59,
    59,
    999
  );
  const clampedEnd = cEnd > dayEnd ? dayEnd : cEnd;

  const startMinutes = differenceInMinutes(clampedStart, dayStart);
  let endMinutes = differenceInMinutes(clampedEnd, dayStart);

  const visibleStart =
    visibleHoursRange.fromMinutes ?? visibleHoursRange.from * 60;
  const visibleEnd =
    visibleHoursRange.toMinutes ?? visibleHoursRange.to * 60;
  endMinutes = Math.min(endMinutes, visibleEnd);
  const durationMinutes = Math.max(endMinutes - startMinutes, 0);

  const gridSpanMinutes =
    visibleHoursRange.gridSpanMinutes ??
    Math.max(visibleEnd - visibleStart, 1);

  const top = ((startMinutes - visibleStart) / gridSpanMinutes) * 100;
  const heightPx = Math.max((durationMinutes / 60) * 96 - 4, 18);

  return { top: `${top}%`, heightPx };
}

/**
 * Verifica se um slot de tempo (hour:minute até hour:minute+15) está bloqueado
 * por algum compromisso ocupado do dia. Recebe os commitments já filtrados para o dia.
 */
export function isSlotBlockedByCommitment(
  dayCommitments: IEvent[],
  day: Date,
  hour: number,
  minute: number
): boolean {
  const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0);
  const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute + 15, 0);

  return dayCommitments.some((c) => {
    if (c.rawCommitment?.allDay) return true;
    const cStart = parseClinicDateTimeIso(c.startDate);
    let cEnd = parseClinicDateTimeIso(c.endDate);
    if (cEnd.getTime() <= cStart.getTime()) {
      cEnd = new Date(cStart.getTime() + 60 * 60_000);
    }
    return cStart < slotEnd && cEnd > slotStart;
  });
}

export function getVisibleHours(
  visibleHours: TVisibleHours,
  singleDayEvents: IEvent[]
) {
  if (
    !visibleHours ||
    typeof visibleHours.from !== "number" ||
    typeof visibleHours.to !== "number"
  ) {
    return {
      hours: [],
      earliestEventHour: 0,
      closingLabelHour: 24,
      fromMinutes: 0,
      toMinutes: 24 * 60,
      gridSpanMinutes: 24 * 60,
      closingFooterHeightPx: 0,
    };
  }

  const fromMinutes =
    visibleHours.fromMinutes ?? visibleHours.from * 60;
  const toMinutes = visibleHours.toMinutes ?? visibleHours.to * 60;
  const closingMinute = toMinutes % 60;

  let earliestEventHour = visibleHours.from;
  const closingLabelHour = displayEndHourFromClosingMinutes(toMinutes);
  let lastSlotHour =
    closingMinute === 0 ? closingLabelHour - 1 : closingLabelHour;

  singleDayEvents.forEach((event) => {
    const startHour = parseClinicDateTimeIso(event.startDate).getHours();
    if (startHour < earliestEventHour) earliestEventHour = startHour;
  });

  lastSlotHour = Math.max(lastSlotHour, earliestEventHour);
  lastSlotHour = Math.min(lastSlotHour, 23);

  const hours =
    lastSlotHour >= earliestEventHour
      ? Array.from(
          { length: lastSlotHour - earliestEventHour + 1 },
          (_, i) => i + earliestEventHour
        )
      : [];

  const gridSpanMinutes = getCalendarGridSpanMinutes(
    fromMinutes,
    hours,
    toMinutes
  );
  const closingFooterHeightPx = getClosingFooterHeightPx(
    fromMinutes,
    hours,
    toMinutes
  );

  return {
    hours,
    earliestEventHour,
    closingLabelHour,
    fromMinutes,
    toMinutes,
    gridSpanMinutes,
    closingFooterHeightPx,
  };
}

// ================ Month view helper functions ================ //

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(
      currentYear,
      currentMonth - 1,
      daysInPrevMonth - firstDayOfMonth + i + 1
    ),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i + 1),
    })
  );

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
  multiDayEvents: IEvent[],
  singleDayEvents: IEvent[],
  selectedDate: Date
) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(
        parseClinicDateTimeIso(a.endDate),
        parseClinicDateTimeIso(a.startDate)
      );
      const bDuration = differenceInDays(
        parseClinicDateTimeIso(b.endDate),
        parseClinicDateTimeIso(b.startDate)
      );
      return (
        bDuration - aDuration ||
        parseClinicDateTimeIso(a.startDate).getTime() -
          parseClinicDateTimeIso(b.startDate).getTime()
      );
    }),
    ...singleDayEvents.sort(
      (a, b) =>
        parseClinicDateTimeIso(a.startDate).getTime() -
        parseClinicDateTimeIso(b.startDate).getTime()
    ),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = parseClinicDateTimeIso(event.startDate);
    const eventEnd = parseClinicDateTimeIso(event.endDate);
    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every((day) => {
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });
      eventPositions[event.id] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(
  date: Date,
  events: IEvent[],
  eventPositions: Record<string, number>
) {
  const eventsForDate = events.filter((event) => {
    const eventStart = parseClinicDateTimeIso(event.startDate);
    const eventEnd = parseClinicDateTimeIso(event.endDate);
    return (
      (date >= eventStart && date <= eventEnd) ||
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd)
    );
  });

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? -1,
      isMultiDay: event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}

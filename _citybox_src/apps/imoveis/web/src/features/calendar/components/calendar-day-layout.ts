import type { SvgIconComponent } from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { timeToMinutes } from '../services/calendar-service';
import type { CalendarAppointment } from '../types';

export const DAY_START_MIN = 8 * 60;
export const DAY_END_MIN = 18 * 60;
/** Quantidade de faixas horárias na grade (08h–18h). */
export const DAY_HOUR_COUNT = (DAY_END_MIN - DAY_START_MIN) / 60;
/** Altura preferencial por hora (timeline natural — a página rola, não a grade). */
export const HOUR_HEIGHT = 72;
/** Padding vertical da timeline (topo + base). */
export const TIMELINE_PAD = 8;
export const HOURS = Array.from({ length: DAY_HOUR_COUNT + 1 }, (_, i) => 8 + i);

/** Altura mínima visual do card (eventos muito curtos). */
export const MIN_EVENT_HEIGHT = 28;

/** Respiro entre cards empilhados / laterais. */
export const EVENT_GAP_PX = 2;

/**
 * Altura por hora dentro de um container (legado).
 * Preferir `HOUR_HEIGHT` fixo: a página rola, a grade não.
 */
export function hourHeightForContainer(containerHeight: number): number {
  if (containerHeight <= 0) return HOUR_HEIGHT;
  const usable = Math.max(0, containerHeight - TIMELINE_PAD * 2);
  const fitted = usable / DAY_HOUR_COUNT;
  return Math.max(36, Math.min(HOUR_HEIGHT, fitted));
}

export function minEventHeightForHour(hourHeight: number): number {
  return Math.min(MIN_EVENT_HEIGHT, Math.max(18, hourHeight * 0.45));
}

export function hourOffsetPx(hour: number, hourHeight: number = HOUR_HEIGHT): number {
  return TIMELINE_PAD + ((hour * 60 - DAY_START_MIN) / 60) * hourHeight;
}

export function minutesOffsetPx(
  minutes: number,
  hourHeight: number = HOUR_HEIGHT,
): number {
  return TIMELINE_PAD + ((minutes - DAY_START_MIN) / 60) * hourHeight;
}

export function timelineTotalHeight(hourHeight: number = HOUR_HEIGHT): number {
  return TIMELINE_PAD * 2 + ((DAY_END_MIN - DAY_START_MIN) / 60) * hourHeight;
}

export function startHourFromTime(time: string): number {
  return Math.floor(timeToMinutes(time) / 60);
}

export function appointmentsOnDay(
  appointments: readonly CalendarAppointment[],
  date: string,
): CalendarAppointment[] {
  return appointments
    .filter((item) => item.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Compromissos que intersectam a faixa `[hour, hour+1)`. */
export function appointmentsInSlot(
  appointments: readonly CalendarAppointment[],
  date: string,
  slotHour: number,
): CalendarAppointment[] {
  const slotStart = slotHour * 60;
  const slotEnd = (slotHour + 1) * 60;
  return appointments
    .filter((item) => {
      if (item.date !== date) return false;
      const start = timeToMinutes(item.startTime);
      let end = timeToMinutes(item.endTime);
      if (end <= start) end = start + 30;
      return start < slotEnd && end > slotStart;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export type PositionedDayEvent = {
  appointment: CalendarAppointment;
  top: number;
  height: number;
  /** Fração 0–1 da largura da coluna. */
  left: number;
  /** Fração 0–1 da largura da coluna. */
  width: number;
};

/** Badge "+N" na timeline quando há mais colunas sobrepostas do que cabem. */
export type PositionedDayOverflow = {
  top: number;
  height: number;
  left: number;
  width: number;
  hiddenCount: number;
  /** Hora civil para abrir a sheet do slot. */
  slotHour: number;
};

export type DayEventsLayout = {
  events: PositionedDayEvent[];
  overflows: PositionedDayOverflow[];
};

/** @deprecated Use `DayEventsLayout`. */
export type DaySlotLayout = DayEventsLayout;

/**
 * Máximo de cards lado a lado na timeline.
 * A coluna extra vira badge "+N" que abre a sheet.
 */
export const MAX_TIMELINE_COLUMNS = 3;

export const KIND_ICON: Record<CalendarAppointment['kind'], SvgIconComponent> = {
  visit: LocationOnOutlinedIcon,
  'follow-up': PhoneOutlinedIcon,
  signing: AccessTimeIcon,
  other: AccessTimeIcon,
};

export function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

type TimedEvent = {
  appointment: CalendarAppointment;
  startMin: number;
  endMin: number;
};

function toTimedEvent(appointment: CalendarAppointment): TimedEvent | null {
  let startMin = timeToMinutes(appointment.startTime);
  let endMin = timeToMinutes(appointment.endTime);
  if (endMin <= startMin) endMin = startMin + 30;

  startMin = Math.max(startMin, DAY_START_MIN);
  endMin = Math.min(endMin, DAY_END_MIN);
  if (endMin <= startMin) return null;
  return { appointment, startMin, endMin };
}

/**
 * Posiciona compromissos pela duração (início → fim) na timeline.
 * Sobreposições viram colunas; acima de `MAX_TIMELINE_COLUMNS` vira badge "+N".
 */
export function layoutDayEventsByDuration(
  events: readonly CalendarAppointment[],
  hourHeight: number = HOUR_HEIGHT,
): DayEventsLayout {
  const timed = events
    .map(toTimedEvent)
    .filter((item): item is TimedEvent => item != null)
    .sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return b.endMin - a.endMin;
    });

  if (timed.length === 0) return { events: [], overflows: [] };

  // Clusters de sobreposição (transitivos).
  const clusters: TimedEvent[][] = [];
  let current: TimedEvent[] = [];
  let clusterEnd = -1;

  for (const event of timed) {
    if (current.length === 0 || event.startMin < clusterEnd) {
      current.push(event);
      clusterEnd = Math.max(clusterEnd, event.endMin);
    } else {
      clusters.push(current);
      current = [event];
      clusterEnd = event.endMin;
    }
  }
  if (current.length > 0) clusters.push(current);

  const positioned: PositionedDayEvent[] = [];
  const overflows: PositionedDayOverflow[] = [];

  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const assigned: { event: TimedEvent; column: number }[] = [];

    for (const event of cluster) {
      let column = columnEnds.findIndex((end) => end <= event.startMin);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(event.endMin);
      } else {
        columnEnds[column] = event.endMin;
      }
      assigned.push({ event, column });
    }

    const naturalColumns = Math.max(1, columnEnds.length);
    const hasOverflow = naturalColumns > MAX_TIMELINE_COLUMNS;
    /** Colunas de cards; se overflow, a última faixa da grade vira o badge. */
    const cardColumns = hasOverflow
      ? MAX_TIMELINE_COLUMNS - 1
      : naturalColumns;
    const layoutColumns = hasOverflow ? MAX_TIMELINE_COLUMNS : naturalColumns;

    let clusterStart = Number.POSITIVE_INFINITY;
    let clusterEndMin = 0;

    for (const { event, column } of assigned) {
      clusterStart = Math.min(clusterStart, event.startMin);
      clusterEndMin = Math.max(clusterEndMin, event.endMin);

      if (hasOverflow && column >= cardColumns) {
        continue;
      }

      const top = minutesOffsetPx(event.startMin, hourHeight);
      const rawHeight =
        minutesOffsetPx(event.endMin, hourHeight) - top - EVENT_GAP_PX;
      const height = Math.max(rawHeight, minEventHeightForHour(hourHeight));

      positioned.push({
        appointment: event.appointment,
        top,
        height,
        left: column / layoutColumns,
        width: 1 / layoutColumns,
      });
    }

    if (hasOverflow) {
      const hiddenCount = assigned.filter((a) => a.column >= cardColumns).length;
      if (hiddenCount > 0) {
        const top = minutesOffsetPx(clusterStart, hourHeight);
        const rawHeight =
          minutesOffsetPx(clusterEndMin, hourHeight) - top - EVENT_GAP_PX;
        const height = Math.max(rawHeight, minEventHeightForHour(hourHeight));
        overflows.push({
          top,
          height,
          left: cardColumns / layoutColumns,
          width: 1 / layoutColumns,
          hiddenCount,
          slotHour: Math.floor(clusterStart / 60),
        });
      }
    }
  }

  return { events: positioned, overflows };
}

/**
 * @deprecated Use `layoutDayEventsByDuration`. Mantido para imports legados.
 */
export function layoutDayEventsByStartSlot(
  events: readonly CalendarAppointment[],
  hourHeight: number = HOUR_HEIGHT,
  _expandedSlotHours?: ReadonlySet<number>,
): DayEventsLayout {
  return layoutDayEventsByDuration(events, hourHeight);
}

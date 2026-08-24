/**
 * Wall-clock America/Bahia (UTC−3 o ano todo — piloto Ilhéus).
 * Persistência em timestamptz; apresentação em date (YYYY-MM-DD) + HH:mm.
 */
export const APPOINTMENT_TIMEZONE = 'America/Bahia';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function partsInBahia(instant: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

/** Instant → `YYYY-MM-DD` no fuso Bahia. */
export function formatAppointmentDate(instant: Date): string {
  const p = partsInBahia(instant);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** Instant → `HH:mm` no fuso Bahia. */
export function formatAppointmentTime(instant: Date): string {
  const p = partsInBahia(instant);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * Interpreta `YYYY-MM-DD` como meia-noite civil em Bahia → instant UTC.
 * Offset fixo −03:00 (sem DST).
 */
export function civilDateStartInBahia(isoDate: string): Date {
  if (!DATE_RE.test(isoDate)) {
    throw new Error(`Invalid civil date: ${isoDate}`);
  }
  return new Date(`${isoDate}T00:00:00.000-03:00`);
}

/** Dia seguinte 00:00 Bahia (limite exclusivo do intervalo inclusivo `to`). */
export function civilDateEndExclusiveInBahia(isoDate: string): Date {
  const start = civilDateStartInBahia(isoDate);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function parseIsoInstant(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO datetime for ${field}: ${value}`);
  }
  return date;
}

/**
 * Horários da agenda clínica são wall-clock local (Ilhéus) persistidos como UTC.
 * Ex.: 08:00 no ERP → `2026-07-09T08:00:00.000Z` no Postgres.
 */

/** Fuso civil da clínica (UTC−3, sem DST) — alinhado a campanhas/CRM. */
export const CLINIC_CIVIL_TIME_ZONE = 'America/Sao_Paulo';

/** Antes desta data, compromissos/consultas sem sufixo Z eram gravados com offset do servidor (UTC−3). */
export const SCHEDULING_TIME_FIX_CUTOFF = new Date('2026-07-08T20:00:00.000Z');

/** Offset do servidor de dev local (America/Bahia) usado na gravação legada. */
export const CLINIC_LEGACY_OFFSET_MS = 3 * 60 * 60_000;

export type ClinicWallClockParts = {
  /** `yyyy-MM-dd` no fuso civil da clínica. */
  date: string;
  /** Minutos desde 00:00 no fuso civil da clínica. */
  minutes: number;
};

/** Partes wall-clock do instante `now` no fuso civil da clínica. */
export function getClinicWallClockParts(
  now: Date = new Date(),
): ClinicWallClockParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_CIVIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0',
  );

  return {
    date: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  };
}

/**
 * Converte um instante real em Date cujas componentes UTC = wall-clock da clínica.
 * Permite comparar `now` com `Appointment.startAt` (também wall-clock-as-UTC).
 *
 * Ex.: `2026-08-06T13:24:00.000Z` (10:24 BRT) → `2026-08-06T10:24:00.000Z`.
 */
export function toClinicWallClockUtc(now: Date = new Date()): Date {
  const { date, minutes } = getClinicWallClockParts(now);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00.000Z`,
  );
}

export function parseClinicDateTime(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date(NaN);
  }

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}:00.000Z`);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}.000Z`);
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const withMs = trimmed.includes('.') ? trimmed : `${trimmed}.000`;
    return new Date(`${withMs}Z`);
  }

  return new Date(trimmed);
}

export function needsLegacySchedulingRebase(
  createdAt: Date,
  updatedAt: Date,
): boolean {
  return (
    createdAt < SCHEDULING_TIME_FIX_CUTOFF &&
    updatedAt < SCHEDULING_TIME_FIX_CUTOFF
  );
}

/** Rebase de registros gravados com `new Date('…T08:00:00')` no servidor UTC−3. */
export function rebaseLegacySchedulingInstant(
  date: Date,
  createdAt: Date,
  updatedAt: Date,
  options: { allDay: boolean; mode: 'start' | 'end' },
): Date {
  if (!needsLegacySchedulingRebase(createdAt, updatedAt)) {
    return date;
  }

  if (options.allDay) {
    const day = date.toISOString().slice(0, 10);
    if (options.mode === 'start') {
      return new Date(`${day}T00:00:00.000Z`);
    }
    return new Date(`${day}T23:59:59.999Z`);
  }

  return new Date(date.getTime() - CLINIC_LEGACY_OFFSET_MS);
}

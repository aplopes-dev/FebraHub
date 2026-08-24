/**
 * Datas do módulo de negócios.
 *
 * - `date-only` (`YYYY-MM-DD`): atividades, `paidAt`/`payoutAt`, despesas. Persistidos
 *   em colunas `@db.Date`, que o Postgres devolve como meia-noite UTC.
 * - Filtros de período incidem sobre `createdAt` (timestamptz) e usam o dia civil de
 *   America/Bahia (UTC−3 o ano todo — piloto Ilhéus).
 */
export const TRANSACTION_TIMEZONE = 'America/Bahia';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  return DATE_ONLY_RE.test(value);
}

/** `YYYY-MM-DD` → meia-noite UTC (formato de escrita das colunas `@db.Date`). */
export function parseDateOnly(value: string, field: string): Date {
  if (!DATE_ONLY_RE.test(value)) {
    throw new Error(`Invalid date for ${field}: ${value}`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${field}: ${value}`);
  }
  return date;
}

/** Coluna `@db.Date` → `YYYY-MM-DD`. */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Data civil de hoje em Bahia, em `YYYY-MM-DD`. */
export function todayDateOnly(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TRANSACTION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Início inclusivo do dia civil `YYYY-MM-DD` em Bahia. */
export function civilDayStartInBahia(value: string, field: string): Date {
  if (!DATE_ONLY_RE.test(value)) {
    throw new Error(`Invalid date for ${field}: ${value}`);
  }
  const date = new Date(`${value}T00:00:00.000-03:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${field}: ${value}`);
  }
  return date;
}

/** Fim exclusivo do dia civil `YYYY-MM-DD` em Bahia (dia seguinte 00:00). */
export function civilDayEndExclusiveInBahia(
  value: string,
  field: string,
): Date {
  const start = civilDayStartInBahia(value, field);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** `Date` → `YYYY-MM-DD` no fuso Bahia (dia civil de um instante). */
export function instantToCivilDate(instant: Date): string {
  return todayDateOnly(instant);
}

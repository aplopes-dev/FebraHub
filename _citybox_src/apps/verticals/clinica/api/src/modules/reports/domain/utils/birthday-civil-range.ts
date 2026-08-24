import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CivilDateRange = {
  startDate: string;
  endDate: string;
};

export function parseCivilDate(value: string): Date {
  if (!DATE_ONLY_RE.test(value)) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid civil date: ${value}`,
      externalMessage: 'Data inválida. Use o formato yyyy-MM-dd.',
      context: `value=${value}`,
    });
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid civil date (nonexistent): ${value}`,
      externalMessage: 'Data inválida.',
      context: `value=${value}`,
    });
  }

  return parsed;
}

export function assertCivilDateRange(input: {
  startDate: string;
  endDate: string;
}): CivilDateRange {
  const start = parseCivilDate(input.startDate);
  const end = parseCivilDate(input.endDate);

  if (end < start) {
    throw new ValidatorDomainError({
      internalMessage: `endDate before startDate: ${input.startDate}..${input.endDate}`,
      externalMessage: 'A data final deve ser maior ou igual à data inicial.',
      context: `startDate=${input.startDate};endDate=${input.endDate}`,
    });
  }

  return { startDate: input.startDate, endDate: input.endDate };
}

function birthdayOccurrenceInUtcYear(
  birthDateIso: string,
  year: number,
): Date | null {
  const birth = parseCivilDate(birthDateIso);
  const month = birth.getUTCMonth();
  const day = birth.getUTCDate();

  // 29/02 em ano não-bissexto → 28/02
  const candidate = new Date(Date.UTC(year, month, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month
  ) {
    return new Date(Date.UTC(year, month + 1, 0));
  }
  return candidate;
}

/**
 * Verifica se o aniversário (mês/dia) cai em algum dia do intervalo [start, end]
 * (datas civis UTC inclusivas). Cobre virada de ano.
 */
export function isBirthdayInCivilDateRange(
  birthDateIso: string,
  range: CivilDateRange,
): boolean {
  if (!birthDateIso.trim()) return false;

  let birthOk = true;
  try {
    parseCivilDate(birthDateIso);
  } catch {
    birthOk = false;
  }
  if (!birthOk) return false;

  const start = parseCivilDate(range.startDate);
  const end = parseCivilDate(range.endDate);
  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);

  for (const year of years) {
    const occurrence = birthdayOccurrenceInUtcYear(birthDateIso, year);
    if (!occurrence) continue;
    if (occurrence >= start && occurrence <= end) return true;
  }

  return false;
}

/** Ocorrência do aniversário dentro do intervalo (para ordenação). */
export function birthdayOccurrenceInRange(
  birthDateIso: string,
  range: CivilDateRange,
): Date | null {
  if (!isBirthdayInCivilDateRange(birthDateIso, range)) return null;

  const start = parseCivilDate(range.startDate);
  const end = parseCivilDate(range.endDate);
  const years = [start.getUTCFullYear(), end.getUTCFullYear()];

  let best: Date | null = null;
  for (const year of years) {
    const occurrence = birthdayOccurrenceInUtcYear(birthDateIso, year);
    if (!occurrence) continue;
    if (occurrence < start || occurrence > end) continue;
    if (!best || occurrence < best) best = occurrence;
  }
  return best;
}

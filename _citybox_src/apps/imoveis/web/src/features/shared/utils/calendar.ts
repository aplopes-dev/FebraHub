export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/** Semana começando na segunda-feira. */
export const WEEK_DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

export type MonthRef = {
  year: number;
  /** 0 = janeiro. */
  month: number;
};

/**
 * Células do mês, incluindo os espaços vazios antes do dia 1.
 * Determinístico (não lê a data atual) — seguro para renderizar no servidor.
 */
export function getMonthDays(ref: MonthRef): readonly (number | null)[] {
  const firstWeekDay = (new Date(ref.year, ref.month, 1).getDay() + 6) % 7;
  const totalDays = new Date(ref.year, ref.month + 1, 0).getDate();

  const leading = Array.from({ length: firstWeekDay }, () => null);
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  return [...leading, ...days];
}

export type MonthGridCell = {
  /** ISO YYYY-MM-DD. */
  date: string;
  day: number;
  inMonth: boolean;
};

function isoFromParts(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Grade completa do mês (semanas de segunda a domingo), com dias dos meses adjacentes. */
export function getMonthGridCells(ref: MonthRef): readonly MonthGridCell[] {
  const firstWeekDay = (new Date(ref.year, ref.month, 1).getDay() + 6) % 7;
  const totalDays = new Date(ref.year, ref.month + 1, 0).getDate();
  const cells: MonthGridCell[] = [];

  const prev = addMonths(ref, -1);
  const prevTotal = new Date(prev.year, prev.month + 1, 0).getDate();
  for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
    const day = prevTotal - i;
    cells.push({
      date: isoFromParts(prev.year, prev.month, day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: isoFromParts(ref.year, ref.month, day),
      day,
      inMonth: true,
    });
  }

  const next = addMonths(ref, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: isoFromParts(next.year, next.month, nextDay),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function getMonthLabel(ref: MonthRef): string {
  return `${MONTH_NAMES[ref.month]} ${ref.year}`;
}

export function addMonths(ref: MonthRef, amount: number): MonthRef {
  const total = ref.year * 12 + ref.month + amount;

  return {
    year: Math.floor(total / 12),
    month: ((total % 12) + 12) % 12,
  };
}

/** Hoje em `YYYY-MM-DD` no fuso do piloto (Ilhéus/America/Bahia). */
export function todayIsoBahia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * `YYYY-MM-DD` → Date local (meio-dia civil) para `DatePicker` do `@citybox/mui`.
 * Evita shift de fuso ao parsear ISO como UTC.
 */
export function isoDateToLocalDate(isoDate: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return undefined;
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date local do picker → `YYYY-MM-DD` (calendário civil, sem UTC). */
export function localDateToIsoDate(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte `2026-07-01` em `{ year: 2026, month: 6 }`. */
export function parseMonthRef(isoDate: string): MonthRef {
  const [year, month] = isoDate.split('-').map(Number);

  return { year, month: month - 1 };
}

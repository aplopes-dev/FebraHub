/** Utilitários de data locais (sem dayjs) para a agenda mock. */

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
const WEEKDAY_LONG = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;
const MONTH_NAMES = [
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

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseIsoDate(iso);
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date);
}

/** Segunda-feira da semana que contém `iso`. */
export function startOfWeekMonday(iso: string): string {
  const date = parseIsoDate(iso);
  const day = date.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function weekDates(iso: string): string[] {
  const start = startOfWeekMonday(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export type MonthCell = {
  date: string;
  inCurrentMonth: boolean;
  isToday: boolean;
};

/** Grade 6×7 começando na segunda-feira. */
export function getMonthGridCells(anchorIso: string): MonthCell[] {
  const anchor = parseIsoDate(anchorIso);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const firstIso = toIsoDate(first);
  const gridStart = startOfWeekMonday(firstIso);
  const today = todayIso();

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    const parsed = parseIsoDate(date);
    return {
      date,
      inCurrentMonth: parsed.getMonth() === month,
      isToday: date === today,
    };
  });
}

export function formatMonthTitle(iso: string): string {
  const date = parseIsoDate(iso);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekTitle(iso: string): string {
  const days = weekDates(iso);
  const start = parseIsoDate(days[0]);
  const end = parseIsoDate(days[6]);
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} de ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
}

export function formatDayTitle(iso: string): string {
  const date = parseIsoDate(iso);
  return `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
}

/** Intervalo inclusivo AAAA-MM-DD para listagem na API conforme a vista. */
export function getAgendaDateRange(
  viewMode: 'month' | 'week' | 'day',
  cursorDate: string,
): { from: string; to: string } {
  if (viewMode === 'day') {
    return { from: cursorDate, to: cursorDate };
  }
  if (viewMode === 'week') {
    const days = weekDates(cursorDate);
    return { from: days[0], to: days[6] };
  }
  const cells = getMonthGridCells(cursorDate);
  return { from: cells[0].date, to: cells[cells.length - 1].date };
}

export function weekdayShortFromIso(iso: string): string {
  return WEEKDAY_SHORT[parseIsoDate(iso).getDay()];
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export { WEEKDAY_SHORT, WEEKDAY_LONG, MONTH_NAMES };

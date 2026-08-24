const WEEKDAY_ABBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;
const MONTH_ABBR = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const;

/** Data do ticket no formato do painel: `SEG · 17 AGO 2026`. */
export function formatTicketDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  const weekday = WEEKDAY_ABBR[date.getDay()];
  const monthAbbr = MONTH_ABBR[date.getMonth()];
  return `${weekday} · ${String(day).padStart(2, '0')} ${monthAbbr} ${year}`;
}

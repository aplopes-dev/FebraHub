/**
 * Utilitários para datas "só calendário" (sem horário) em fuso local.
 * Evita `new Date('yyyy-MM-dd')` e `toISOString()` que deslocam o dia em UTC−3.
 */

/** Converte `yyyy-MM-dd` para meia-noite no fuso local do navegador. */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formata um `Date` como `yyyy-MM-dd` usando o calendário local. */
export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Horários da agenda clínica: wall-clock da clínica persistido como UTC na API.
 * Ex.: usuário digita 15:00 → API `…T15:00:00.000Z` → UI mostra 15:00 (não 12:00 em UTC−3).
 */

/** `yyyy-MM-dd` a partir do ISO da API. */
export function formatClinicDateFromIso(iso: string): string {
  return iso.slice(0, 10);
}

/** `HH:mm` a partir do ISO da API (componentes UTC = wall-clock da clínica). */
export function formatClinicTimeFromIso(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converte ISO da API em `Date` local para grid do calendário:
 * dia no calendário local + hora wall-clock (sem shift de fuso).
 */
export function parseClinicDateTimeIso(iso: string): Date {
  const datePart = iso.slice(0, 10);
  const timeMatch = iso.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  const seconds = timeMatch?.[3] ? Number(timeMatch[3]) : 0;
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds, 0);
}

/** Serializa `Date` do grid de volta para ISO wall-clock da clínica. */
export function clinicDateTimeToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

export function buildClinicDateTimeIso(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

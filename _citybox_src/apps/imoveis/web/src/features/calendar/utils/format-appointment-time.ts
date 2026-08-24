/** Formatação de horário da agenda no estilo Listify (ex.: "10AM - 11.30AM"). */

function toAmPm(time: string): string {
  const [hRaw, mRaw] = time.split(':').map(Number);
  const h = hRaw || 0;
  const m = mRaw || 0;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${h12}${suffix}`;
  return `${h12}.${String(m).padStart(2, '0')}${suffix}`;
}

/** Ex.: "10AM - 11.30AM" (Listify Figma). */
export function formatAppointmentTimeRange(startTime: string, endTime: string): string {
  return `${toAmPm(startTime)} - ${toAmPm(endTime)}`;
}

/** Só horário de início no chip da grade (ex.: "9AM"). */
export function formatAppointmentStartTime(startTime: string): string {
  return toAmPm(startTime);
}

/** Data curta da agenda (ex.: "12/08") — sem ano. */
export function formatAppointmentDate(date: string): string {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}`;
}

export function formatAppointmentDurationHours(
  startTime: string,
  endTime: string,
): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const minutes = Math.max(0, (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0)));
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
}

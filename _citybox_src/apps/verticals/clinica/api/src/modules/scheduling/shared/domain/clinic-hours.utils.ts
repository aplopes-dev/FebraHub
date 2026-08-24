import { parseTimeToMinutes } from './time-range.utils';

/** Extrai minutos wall-clock de um instante persistido como UTC literal na agenda. */
export function appointmentWallClockMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function isAppointmentWithinClinicHours(
  startAt: Date,
  endAt: Date,
  openingTime: string,
  closingTime: string,
): boolean {
  const openMinutes = parseTimeToMinutes(openingTime);
  const closeMinutes = parseTimeToMinutes(closingTime);
  const startMinutes = appointmentWallClockMinutes(startAt);
  const endMinutes = appointmentWallClockMinutes(endAt);

  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

import { parseClinicDateTime } from '../../../shared/domain/clinic-datetime.utils';

export function computeAppointmentEndAt(
  startAt: Date,
  durationMin: number,
): Date {
  return new Date(startAt.getTime() + durationMin * 60_000);
}

export function parseAppointmentDate(isoDate: string): Date {
  return parseClinicDateTime(isoDate);
}

export function parseOptionalDateOnly(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

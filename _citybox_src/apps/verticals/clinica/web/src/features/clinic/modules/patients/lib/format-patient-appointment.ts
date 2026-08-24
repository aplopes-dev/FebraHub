import {
  formatClinicDateFromIso,
  formatClinicTimeFromIso,
} from '@/features/clinic/agenda/lib/clinic-datetime';
import {
  getAppointmentStatusDisplayLabel,
  isCancelledOrMissedAppointmentStatus,
  isConfirmedAppointmentStatus,
} from '@/features/clinic/agenda/utils/calendar-transform';
import type { AppointmentStatus } from '@/features/clinic/agenda/api/types';

/** `dd/MM/yyyy às HH:mm` (wall-clock da clínica). */
export function formatPatientAppointmentWhen(iso: string): string {
  const datePart = formatClinicDateFromIso(iso);
  const time = formatClinicTimeFromIso(iso);
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) {
    return iso;
  }
  return `${day}/${month}/${year} às ${time}`;
}

export function formatPatientAppointmentStatus(
  status: AppointmentStatus | string,
  confirmationSource?: 'manual' | 'whatsapp' | null,
): string {
  if (status === 'cancelled_patient' || status === 'cancelled_pro') {
    return 'Cancelada';
  }
  return getAppointmentStatusDisplayLabel(status, confirmationSource);
}

/** Cor do texto do status: agendada=azul, confirmada=verde, cancelada/falta=vermelho. */
export function getPatientAppointmentStatusTextClass(
  status: AppointmentStatus | string,
): string {
  if (isCancelledOrMissedAppointmentStatus(status)) {
    return 'text-red-600';
  }
  if (isConfirmedAppointmentStatus(status)) {
    return 'text-emerald-600';
  }
  if (status === 'scheduled') {
    return 'text-blue-600';
  }
  return 'text-muted-foreground';
}

export function resolvePatientAppointmentProfessionalName(
  professionalId: string,
  apiName: string | null | undefined,
  nameById: Map<string, string>,
): string {
  const fromApi = apiName?.trim();
  if (fromApi) return fromApi;
  return nameById.get(professionalId) ?? 'Profissional não informado';
}

export function buildAgendaDateHref(appointmentIso: string): string {
  const date = formatClinicDateFromIso(appointmentIso);
  return `/agenda?date=${encodeURIComponent(date)}`;
}

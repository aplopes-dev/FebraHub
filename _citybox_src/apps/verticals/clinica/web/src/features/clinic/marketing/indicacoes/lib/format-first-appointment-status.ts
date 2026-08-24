import type { FirstAppointmentStatus } from '../types/indicacoes';

export const FIRST_APPOINTMENT_STATUS_LABEL: Record<
  FirstAppointmentStatus,
  string
> = {
  agendada: 'Agendada',
  nao_realizada: 'Não realizada',
  realizada: 'Realizada',
};

export function formatFirstAppointmentStatusLabel(
  status: FirstAppointmentStatus,
): string {
  return FIRST_APPOINTMENT_STATUS_LABEL[status];
}

export function firstAppointmentStatusBadgeClass(
  status: FirstAppointmentStatus,
): string {
  switch (status) {
    case 'agendada':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
    case 'realizada':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'nao_realizada':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
  }
}

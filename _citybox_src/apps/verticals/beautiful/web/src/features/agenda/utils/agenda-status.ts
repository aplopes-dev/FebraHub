import type { AppointmentStatus } from '../types/agenda.types';

export type StatusVisual = {
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  softBg: string;
  softFg: string;
};

export const APPOINTMENT_STATUS_VISUAL: Record<AppointmentStatus, StatusVisual> = {
  SCHEDULED: {
    label: 'Agendado',
    color: 'info',
    softBg: 'info.main',
    softFg: 'common.white',
  },
  CONFIRMED: {
    label: 'Confirmado',
    color: 'primary',
    softBg: 'primary.main',
    softFg: 'common.white',
  },
  IN_PROGRESS: {
    label: 'Em atendimento',
    color: 'warning',
    softBg: 'warning.main',
    softFg: 'common.white',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'success',
    softBg: 'success.main',
    softFg: 'common.white',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'default',
    softBg: 'grey.600',
    softFg: 'common.white',
  },
  NO_SHOW: {
    label: 'Falta',
    color: 'error',
    softBg: 'error.main',
    softFg: 'common.white',
  },
};

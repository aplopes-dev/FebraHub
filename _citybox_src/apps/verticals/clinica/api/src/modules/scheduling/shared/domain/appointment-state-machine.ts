import type { AppointmentStatus } from './appointment-types';
import { BLOCKING_APPOINTMENT_STATUSES } from './appointment-types';

const REOPEN_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'patient_waiting',
];

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: [
    'confirmed',
    'patient_waiting',
    'in_progress',
    'missed',
    'cancelled_patient',
    'cancelled_pro',
  ],
  confirmed: [
    'patient_waiting',
    'in_progress',
    'missed',
    'cancelled_patient',
    'cancelled_pro',
  ],
  patient_waiting: ['in_progress', 'cancelled_patient', 'cancelled_pro'],
  in_progress: ['finished'],
  finished: [],
  missed: [...REOPEN_STATUSES, 'cancelled_patient', 'cancelled_pro'],
  cancelled_patient: ['cancelled_pro', ...REOPEN_STATUSES],
  cancelled_pro: ['cancelled_patient', ...REOPEN_STATUSES],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Reabrir cancelada/falta para um status que volta a bloquear o horário. */
export function isReopeningBlockingAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  const fromBlocks = BLOCKING_APPOINTMENT_STATUSES.includes(from);
  const toBlocks = BLOCKING_APPOINTMENT_STATUSES.includes(to);
  return !fromBlocks && toBlocks;
}

export function assertAppointmentStatusTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  if (!canTransitionAppointmentStatus(from, to)) {
    throw new Error(`Invalid appointment status transition: ${from} -> ${to}`);
  }
}

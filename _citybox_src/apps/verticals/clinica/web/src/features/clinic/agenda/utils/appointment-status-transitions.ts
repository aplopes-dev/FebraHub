import type { AppointmentStatus } from '@/features/clinic/agenda/api/types';

/**
 * Espelho da máquina de estados da API
 * (`appointment-state-machine.ts`). Manter alinhado ao alterar transições.
 */
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
  missed: [
    'scheduled',
    'confirmed',
    'patient_waiting',
    'cancelled_patient',
    'cancelled_pro',
  ],
  cancelled_patient: [
    'cancelled_pro',
    'scheduled',
    'confirmed',
    'patient_waiting',
  ],
  cancelled_pro: [
    'cancelled_patient',
    'scheduled',
    'confirmed',
    'patient_waiting',
  ],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedAppointmentStatusTransitions(
  from: AppointmentStatus,
): AppointmentStatus[] {
  return [from, ...ALLOWED_TRANSITIONS[from]];
}

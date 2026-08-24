export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
  'finished',
  'missed',
  'cancelled_patient',
  'cancelled_pro',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const BLOCKING_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
];

export const TERMINAL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'finished',
  'missed',
  'cancelled_patient',
  'cancelled_pro',
];

export const EDITABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'patient_waiting',
];

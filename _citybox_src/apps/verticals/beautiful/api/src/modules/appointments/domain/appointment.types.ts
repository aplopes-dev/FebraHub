export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentServiceLine = {
  id?: string;
  professionalId: string;
  professionalName?: string;
  serviceId: string;
  serviceName?: string;
  price: number;
  duration: number;
};

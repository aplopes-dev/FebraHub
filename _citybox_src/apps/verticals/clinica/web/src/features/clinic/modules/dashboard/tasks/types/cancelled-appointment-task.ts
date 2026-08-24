export type CancelledAppointmentTask = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  professionalName: string;
  /** ISO wall-clock da clínica (`…T15:00:00.000Z`). */
  appointmentAt: string;
  durationMin: number;
  categoryId: string | null;
  observations: string | null;
  status?: 'missed' | 'cancelled_patient' | 'cancelled_pro';
};

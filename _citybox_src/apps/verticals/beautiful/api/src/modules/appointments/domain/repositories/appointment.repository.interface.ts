import { AppointmentEntity } from '../entities/appointment.entity';
import type { AppointmentStatus } from '../appointment.types';

export interface ListAppointmentsFilter {
  /** YYYY-MM-DD — início do período (inclusive) */
  from: string;
  /** YYYY-MM-DD — fim do período (inclusive) */
  to: string;
  professionalId?: string;
  status?: AppointmentStatus;
  clientId?: string;
}

/** Status que ocupam o profissional na grade (não CANCELLED / NO_SHOW / COMPLETED). */
export const BLOCKING_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
];

export abstract class AppointmentRepository {
  abstract save(appointment: AppointmentEntity): Promise<void>;
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null>;
  abstract findAll(
    storeId: string,
    filter: ListAppointmentsFilter,
  ): Promise<AppointmentEntity[]>;
  /**
   * True se já existe agendamento bloqueante do profissional
   * com intervalo [startAt, endAt) sobreposto (start < otherEnd && end > otherStart).
   */
  abstract hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean>;
}

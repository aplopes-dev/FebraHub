import type { AppointmentStatus } from '../../../shared/domain/appointment-types';
import type { Appointment } from '../entities/appointment.entity';

export type AppointmentCategorySnapshot = {
  id: string;
  name: string;
  color: string;
} | null;

export type AppointmentDetail = {
  appointment: Appointment;
  patientName: string;
  patientPhone: string | null;
  category: AppointmentCategorySnapshot;
};

export type AppointmentListSortBy = 'startAt' | 'status' | 'patientName';

export type AppointmentListCriteria = {
  skip: number;
  take: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
  status?: AppointmentStatus;
  patientId?: string;
  sortBy?: AppointmentListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type AppointmentCalendarCriteria = {
  startDate: string;
  endDate: string;
  professionalIds?: string[];
};

export type SaveAppointmentOptions = {
  fitInId?: string | null;
};

export type AppointmentDashboardListItem = {
  id: string;
  startAt: Date;
  status: Extract<
    AppointmentStatus,
    'finished' | 'missed' | 'cancelled_patient' | 'cancelled_pro'
  >;
  categoryId: string | null;
  categoryName: string | null;
  patientId: string;
  patientName: string;
  phone: string;
  professionalId: string;
};

export type CancelledAppointmentTaskListItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  startAt: Date;
  durationMin: number;
  categoryId: string | null;
  notes: string | null;
  status: Extract<
    AppointmentStatus,
    'missed' | 'cancelled_patient' | 'cancelled_pro'
  >;
};

export type CancelledAppointmentTasksListResult = {
  items: CancelledAppointmentTaskListItem[];
  total: number;
};

export abstract class AppointmentRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentDetail | null>;

  abstract findMany(
    storeId: string,
    criteria: AppointmentListCriteria,
  ): Promise<AppointmentDetail[]>;

  abstract count(
    storeId: string,
    criteria: Omit<AppointmentListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract findForCalendar(
    storeId: string,
    criteria: AppointmentCalendarCriteria,
  ): Promise<AppointmentDetail[]>;

  abstract findBlockingByProfessionalAndRange(
    storeId: string,
    professionalId: string,
    rangeStart: Date,
    rangeEnd: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]>;

  abstract hasOverlap(
    storeId: string,
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean>;

  abstract save(
    appointment: Appointment,
    options?: SaveAppointmentOptions,
  ): Promise<AppointmentDetail>;

  abstract delete(storeId: string, id: string): Promise<void>;

  abstract listAppointmentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<AppointmentDashboardListItem[]>;

  abstract listAppointmentDashboardYears(storeId: string): Promise<number[]>;

  abstract listCancelledAppointmentTasksInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
    pagination: { skip: number; take: number },
  ): Promise<CancelledAppointmentTasksListResult>;

  /** Consultas confirmadas com início no intervalo (lembrete WhatsApp T-2h). */
  abstract findConfirmedInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]>;

  /** Consultas ainda `scheduled` com início no intervalo (lembrete T-5min sem reply). */
  abstract findScheduledInStartRange(
    storeId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<AppointmentDetail[]>;
}

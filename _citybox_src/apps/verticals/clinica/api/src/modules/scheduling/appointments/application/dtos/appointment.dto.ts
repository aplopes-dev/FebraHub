import type { AppointmentStatus } from '../../../shared/domain/appointment-types';
import type {
  AppointmentChannel,
  InsuranceType,
  ReturnOption,
} from '../../../shared/domain/scheduling-enums';
import type { AppointmentDetail } from '../../domain/repositories/appointment.repository.interface';

export type CreateAppointmentInput = {
  patientId: string;
  professionalId: string;
  professionalName?: string;
  procedureId?: string | null;
  roomId?: string | null;
  categoryId?: string | null;
  channel?: AppointmentChannel | null;
  insuranceType?: InsuranceType;
  date: string;
  durationMin: number;
  observations?: string | null;
  returnOption?: ReturnOption | null;
  returnDate?: string | null;
  returnReason?: string | null;
  fitInId?: string;
  /** Alerta de retorno consumido ao agendar — removido após criar a consulta. */
  returnAlertId?: string;
  /** Enfileira confirmação WhatsApp após criar (requer conexão ativa). */
  sendWhatsAppConfirmation?: boolean;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export type CreateAppointmentDto = {
  storeId: string;
  input: CreateAppointmentInput;
};

export type UpdateAppointmentDto = {
  storeId: string;
  id: string;
  input: UpdateAppointmentInput;
};

export type UpdateAppointmentStatusDto = {
  storeId: string;
  id: string;
  status: AppointmentStatus;
  confirmationSource?: 'manual' | 'whatsapp' | null;
};

export type GetAppointmentDto = {
  storeId: string;
  id: string;
};

export type DeleteAppointmentDto = {
  storeId: string;
  id: string;
};

export type ListAppointmentsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
  status?: AppointmentStatus;
  patientId?: string;
  sortBy?: 'startAt' | 'status' | 'patientName';
  sortOrder?: 'asc' | 'desc';
};

export type ListAppointmentsResult = {
  items: AppointmentPresentation[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type GetAppointmentCalendarDto = {
  storeId: string;
  startDate: string;
  endDate: string;
  professionalIds?: string[];
};

export type AppointmentPresentation = ReturnType<
  typeof toAppointmentPresentation
>;

export function toAppointmentPresentation(
  detail: AppointmentDetail,
  professionalName = '',
): {
  id: string;
  clinicId: string;
  patientId: string;
  professionalId: string;
  categoryId: string | null;
  status: AppointmentStatus;
  confirmationSource: 'manual' | 'whatsapp' | null;
  date: string;
  durationMin: number;
  observations: string | null;
  returnOption: ReturnOption | null;
  returnDate: string | null;
  returnReason: string | null;
  patient: { id: string; name: string };
  professional: { id: string; name: string };
  category: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
} {
  const { appointment } = detail;
  return {
    id: appointment.id,
    clinicId: appointment.storeId,
    patientId: appointment.patientId,
    professionalId: appointment.professionalId,
    categoryId: appointment.categoryId,
    status: appointment.status,
    confirmationSource: appointment.confirmationSource,
    date: appointment.startAt.toISOString(),
    durationMin: appointment.durationMin,
    observations: appointment.notes,
    returnOption: appointment.returnOption,
    returnDate: appointment.returnDate
      ? appointment.returnDate.toISOString()
      : null,
    returnReason: appointment.returnReason,
    patient: {
      id: appointment.patientId,
      name: detail.patientName,
    },
    professional: {
      id: appointment.professionalId,
      name: professionalName,
    },
    category: detail.category,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export function toCalendarAppointmentItem(
  detail: AppointmentDetail,
  professionalName = '',
) {
  const full = toAppointmentPresentation(detail, professionalName);
  const { updatedAt: _updatedAt, clinicId: _clinicId, ...calendarItem } = full;
  return calendarItem;
}

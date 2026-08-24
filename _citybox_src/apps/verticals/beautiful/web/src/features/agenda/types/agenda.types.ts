export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AgendaViewMode = 'month' | 'week' | 'day';

export const AGENDA_VIEW_MODE_LABEL: Record<AgendaViewMode, string> = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Falta',
};

/** Profissional simplificado para filtros e colunas da agenda (= member agendável). */
export type AgendaProfessional = {
  id: string;
  name: string;
  active: boolean;
  color: string;
  serviceIds?: string[];
};

export type AgendaClientOption = {
  id: string;
  name: string;
  phone: string;
};

export type AgendaCategoryOption = {
  id: string;
  name: string;
  color: string;
};

export type AgendaServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

/**
 * Agendamento flattenado para UI (Appointment + serviço/profissional principais).
 * Mapeado da API (`AppointmentPresenter`).
 */
export type AgendaAppointment = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  status: AppointmentStatus;
  totalPrice: number;
};

export type AppointmentClientMode = 'existing' | 'new';

export type AppointmentFormData = {
  /** Preenchido quando `clientMode === 'existing'`. */
  clientId?: string;
  /** Preenchido quando `clientMode === 'new'` — cadastro + agendamento no mesmo POST. */
  newClient?: { name: string; phone: string };
  categoryId?: string | null;
  clientNotes: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  status: AppointmentStatus;
};

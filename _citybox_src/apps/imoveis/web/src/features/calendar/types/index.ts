export type AppointmentKind = 'visit' | 'follow-up' | 'signing' | 'other';

export type ScheduleListFilter = 'all' | 'assigned' | 'mine';

/** Visualização principal da agenda. */
export type CalendarViewMode = 'day' | 'week' | 'month';

export const CALENDAR_VIEW_MODE_LABEL: Record<CalendarViewMode, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
};

export type CalendarAppointment = {
  id: string;
  title: string;
  /** Texto curto opcional (máx. 40 caracteres). */
  description?: string;
  /** ISO date YYYY-MM-DD (America/Bahia). */
  date: string;
  /** HH:mm (America/Bahia). */
  startTime: string;
  /** HH:mm (America/Bahia). */
  endTime: string;
  location: string;
  kind: AppointmentKind;
  agentId: string;
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadPhotoUrl?: string;
  propertyId?: string;
  done: boolean;
};

/** Params da API: intervalo obrigatório + filtros de corretor. */
export type ListAppointmentsParams = {
  from: string;
  to: string;
  agentId?: string;
  excludeAgentId?: string;
  kind?: readonly AppointmentKind[];
  /** Omitido = concluídos e pendentes. */
  done?: boolean;
  page?: number;
  perPage?: number;
};

export type ListAppointmentsResult = {
  data: CalendarAppointment[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/** Input do formulário — service monta startsAt/endsAt ISO. */
export type AppointmentWriteInput = {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  kind: AppointmentKind;
  agentId: string;
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadPhotoUrl?: string;
  propertyId?: string;
  done?: boolean;
};

export const APPOINTMENT_KIND_LABEL: Record<AppointmentKind, string> = {
  visit: 'Visita',
  'follow-up': 'Follow-up',
  signing: 'Assinatura',
  other: 'Outro',
};

export const SCHEDULE_FILTER_LABEL: Record<ScheduleListFilter, string> = {
  all: 'Todos',
  assigned: 'Atribuídos',
  mine: 'Minha agenda',
};

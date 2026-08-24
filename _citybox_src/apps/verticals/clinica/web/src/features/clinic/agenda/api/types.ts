export type AppointmentStatus =
  | 'scheduled'
  | 'cancelled_patient'
  | 'cancelled_pro'
  | 'in_progress'
  | 'confirmed'
  | 'missed'
  | 'finished'
  | 'patient_waiting';

export type ReturnOption =
  | 'none'
  | 'one_month'
  | 'six_months'
  | 'twelve_months'
  | 'custom_date';

export type ScheduleAvailability = 'busy' | 'available';
export type SchedulePrivacy = 'private' | 'public';
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type RecurrenceEnd = 'never' | 'on_date';

export interface AppointmentCategoryApi {
  id: string;
  clinicId: string;
  name: string;
  color: string;
  appointmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentPersonApi {
  id: string;
  name: string;
}

export interface AppointmentApi {
  id: string;
  clinicId: string;
  patientId: string;
  professionalId: string;
  categoryId: string | null;
  status: AppointmentStatus;
  confirmationSource?: 'manual' | 'whatsapp' | null;
  date: string;
  durationMin: number;
  observations: string | null;
  returnOption: ReturnOption | null;
  returnDate: string | null;
  returnReason: string | null;
  patient: AppointmentPersonApi;
  professional: AppointmentPersonApi;
  category: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisplacedAppointmentSummary {
  appointmentId: string;
  fitInId: string;
  patientId: string;
}

export interface CommitmentApi {
  id: string;
  clinicId: string;
  professionalId: string;
  title: string;
  description: string | null;
  allDay: boolean;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEnd: RecurrenceEnd | null;
  recurrenceEndDate: string | null;
  availability: ScheduleAvailability;
  privacy: SchedulePrivacy;
  createdAt: string;
  updatedAt: string;
  /** Preenchido no create/update quando consultas sobrepostas foram para Gestão de Encaixe. */
  displacedAppointments?: DisplacedAppointmentSummary[];
}

export interface CalendarAppointmentItem {
  id: string;
  patientId: string;
  professionalId: string;
  categoryId: string | null;
  status: AppointmentStatus;
  confirmationSource?: 'manual' | 'whatsapp' | null;
  date: string;
  durationMin: number;
  observations: string | null;
  returnOption: ReturnOption | null;
  returnDate: string | null;
  returnReason: string | null;
  patient: AppointmentPersonApi;
  professional: AppointmentPersonApi;
  category: { id: string; name: string; color: string } | null;
  createdAt: string;
}

export interface CalendarScheduleItem {
  id: string;
  professionalId: string;
  title: string;
  description: string | null;
  allDay: boolean;
  startDate: string;
  endDate: string;
  recurring: boolean;
  recurrenceType: RecurrenceType | null;
  recurrenceEnd: RecurrenceEnd | null;
  recurrenceEndDate: string | null;
  availability: ScheduleAvailability;
  privacy: SchedulePrivacy;
}

export interface CalendarResponse {
  appointments: CalendarAppointmentItem[];
  schedules: CalendarScheduleItem[];
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  professionalId: string;
  categoryId?: string | null;
  date: string;
  durationMin: number;
  observations?: string | null;
  returnOption?: ReturnOption;
  returnDate?: string | null;
  returnReason?: string | null;
  fitInId?: string;
  returnAlertId?: string;
  sendWhatsAppConfirmation?: boolean;
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export interface UpdateAppointmentStatusInput {
  status: AppointmentStatus;
  confirmationSource?: 'manual' | 'whatsapp' | null;
}

export interface CreateCommitmentInput {
  professionalId: string;
  title: string;
  description?: string | null;
  allDay?: boolean;
  startDate: string;
  endDate: string;
  recurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceEnd?: RecurrenceEnd | null;
  recurrenceEndDate?: string | null;
  availability?: ScheduleAvailability;
  privacy?: SchedulePrivacy;
}

export type UpdateCommitmentInput = Partial<Omit<CreateCommitmentInput, 'professionalId'>>;

export interface TimeSlotItem {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  professionalId: string;
  durationMin: number;
  workingWindow: { startTime: string; endTime: string } | null;
  slots: TimeSlotItem[];
}

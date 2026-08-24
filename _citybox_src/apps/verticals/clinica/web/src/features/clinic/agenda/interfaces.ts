import type {
  TAppointmentStatus,
  TAvailability,
  TEventColor,
  TEventType,
  TPrivacy,
  TRepeatEndType,
  TRepeatFrequency,
  TReturnOption,
} from "./types";
import type {
  CalendarAppointmentItem,
  CalendarScheduleItem,
} from "./api/types";

// ==================== Base Entities ==================== //

export interface IProfessional {
  id: string;
  name: string;
  picturePath: string | null;
  specialty?: string;
}

export interface IPatient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// ==================== Calendar Cell ==================== //

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

// ==================== Event Base ==================== //

export interface IEventBase {
  id: string;
  type: TEventType;
  professionalId: string;
  professional: IProfessional;
  color: TEventColor;
  createdAt: string;
  updatedAt: string;
}

// ==================== Appointment (Consulta) ==================== //

export interface IAppointmentCategory {
  id: string;
  name: string;
  color: string;
}

export interface IAppointmentReturn {
  period: TReturnOption;
  returnDate?: string;
  reason?: string;
}

export interface IAppointment extends IEventBase {
  type: "appointment";
  patientId: string;
  patient: IPatient;
  status: TAppointmentStatus;
  date: string;
  startTime: string;
  durationMinutes: number;
  observation?: string;
  returnInfo?: IAppointmentReturn;
  categoryId?: string | null;
  category?: IAppointmentCategory | null;
}

// ==================== Commitment (Compromisso) ==================== //

export interface ICommitmentRepeat {
  frequency: TRepeatFrequency;
  endType: TRepeatEndType;
  endDate?: string;
}

export interface ICommitmentSettings {
  availability: TAvailability;
  privacy: TPrivacy;
}

export interface ICommitment extends IEventBase {
  type: "commitment";
  title: string;
  description?: string;
  isAllDay: boolean;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  repeat?: ICommitmentRepeat;
  settings: ICommitmentSettings;
}

// ==================== Union Type ==================== //

export type IScheduling = IAppointment | ICommitment;

// ==================== Legacy (Deprecated) ==================== //

/** @deprecated Use IProfessional instead */
export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

/** @deprecated Use IScheduleEvent instead */
export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  eventType?: "appointment" | "commitment";
  appointmentStatus?: TAppointmentStatus;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  rawAppointment?: CalendarAppointmentItem;
  rawCommitment?: CalendarScheduleItem;
}

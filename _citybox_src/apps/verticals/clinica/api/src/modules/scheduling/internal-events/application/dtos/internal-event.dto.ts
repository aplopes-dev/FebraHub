import type {
  InternalEventAvailability,
  InternalEventPrivacy,
  RecurrenceEnd,
  RecurrenceType,
} from '../../../shared/domain/scheduling-enums';
import type { InternalEvent } from '../../domain/entities/internal-event.entity';
import type { DisplacedAppointmentSummary } from '../services/displace-appointments-for-commitment.service';

export type CreateInternalEventInput = {
  professionalId: string;
  roomId?: string | null;
  title: string;
  description?: string | null;
  allDay?: boolean;
  startDate: string;
  endDate: string;
  recurring?: boolean;
  recurrenceType?: RecurrenceType | null;
  recurrenceEnd?: RecurrenceEnd | null;
  recurrenceEndDate?: string | null;
  availability?: InternalEventAvailability;
  privacy?: InternalEventPrivacy;
};

export type UpdateInternalEventInput = Partial<CreateInternalEventInput>;

export type CreateInternalEventDto = {
  storeId: string;
  input: CreateInternalEventInput;
};

export type UpdateInternalEventDto = {
  storeId: string;
  id: string;
  input: UpdateInternalEventInput;
};

export type GetInternalEventDto = {
  storeId: string;
  id: string;
};

export type DeleteInternalEventDto = {
  storeId: string;
  id: string;
};

export type ListInternalEventsDto = {
  storeId: string;
  startDate?: string;
  endDate?: string;
  professionalIds?: string[];
};

export type InternalEventPresentation = ReturnType<
  typeof toInternalEventPresentation
>;

export function toInternalEventPresentation(
  event: InternalEvent,
  displacedAppointments: DisplacedAppointmentSummary[] = [],
) {
  return {
    id: event.id,
    clinicId: event.storeId,
    professionalId: event.professionalId,
    title: event.title,
    description: event.description,
    allDay: event.allDay,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    recurring: event.recurring,
    recurrenceType: event.recurrenceType,
    recurrenceEnd: event.recurrenceEnd,
    recurrenceEndDate: event.recurrenceEndDate
      ? event.recurrenceEndDate.toISOString().slice(0, 10)
      : null,
    availability: event.availability,
    privacy: event.privacy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    displacedAppointments,
  };
}

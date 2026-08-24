import type { AppointmentEntity } from '../../../../domain/entities/appointment.entity';
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from '../../../../application/policies/appointment-datetime.policy';

/** Shape HTTP de um compromisso (sem envelope `{ data }`). */
export function mapAppointmentToHttp(appointment: AppointmentEntity) {
  return {
    id: appointment.id,
    title: appointment.title,
    description: appointment.description || undefined,
    date: formatAppointmentDate(appointment.startsAt),
    startTime: formatAppointmentTime(appointment.startsAt),
    endTime: formatAppointmentTime(appointment.endsAt),
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    location: appointment.location,
    kind: appointment.kind,
    agentId: appointment.agentId,
    done: appointment.done,
    leadId: appointment.leadId ?? undefined,
    leadName: appointment.leadName ?? undefined,
    leadEmail: appointment.leadEmail ?? undefined,
    leadPhone: appointment.leadPhone ?? undefined,
    leadPhotoUrl: appointment.leadPhotoUrl ?? undefined,
    propertyId: appointment.propertyId ?? undefined,
  };
}

export type AppointmentHttpDto = ReturnType<typeof mapAppointmentToHttp>;

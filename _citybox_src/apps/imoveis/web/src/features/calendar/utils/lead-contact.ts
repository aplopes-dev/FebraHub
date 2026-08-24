import type { LeadContactInfo } from '@/features/shared/utils/lead-contact';
import type { CalendarAppointment } from '../types';

export type { LeadContactInfo } from '@/features/shared/utils/lead-contact';

/** Contato a partir dos campos denormalizados no compromisso. */
export function resolveLeadContact(appointment: CalendarAppointment): LeadContactInfo {
  return {
    name: appointment.leadName ?? appointment.title,
    email: appointment.leadEmail,
    phone: appointment.leadPhone,
  };
}

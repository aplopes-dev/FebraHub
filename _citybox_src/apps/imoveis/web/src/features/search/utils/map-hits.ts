import type { ContactLeadDetail } from '@/features/leads/types';
import { LEAD_STATUS_LABEL } from '@/features/leads/types';
import type { PropertyListing } from '@/features/properties/types';
import type { Transaction } from '@/features/transactions/types';
import {
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
} from '@/features/transactions/types';
import type { NavItem } from '@/features/shared/data/navigation';
import type { GlobalSearchHit } from '../types';
import type { CalendarAppointment } from '@/features/calendar/types';

function leadLocation(lead: ContactLeadDetail): string {
  const parts = [lead.city, lead.state].filter(Boolean);
  return parts.join(', ');
}

export function hitFromLead(lead: ContactLeadDetail): GlobalSearchHit {
  const location = leadLocation(lead);
  const status = LEAD_STATUS_LABEL[lead.status] ?? lead.status;
  return {
    id: `lead-${lead.id}`,
    type: 'lead',
    title: lead.name,
    subtitle: [location, status].filter(Boolean).join(' · ') || undefined,
    href: `/leads/${lead.id}`,
    keywords: [
      lead.email ?? '',
      lead.phone ?? '',
      location,
      lead.preferredLocation ?? '',
      lead.propertyName ?? '',
      lead.budgetRange ?? '',
      status,
      lead.notes ?? '',
    ],
  };
}

export function hitFromProperty(property: PropertyListing): GlobalSearchHit {
  const location = [property.city, property.state].filter(Boolean).join(', ');
  return {
    id: `property-${property.id}`,
    type: 'property',
    title: property.name,
    subtitle: location || undefined,
    href: `/properties/${property.id}`,
    keywords: [
      property.address ?? '',
      location,
      property.zipCode ?? '',
      property.typeCode ?? '',
      property.type,
      property.status,
    ],
  };
}

export function hitFromTransaction(tx: Transaction): GlobalSearchHit {
  const type = TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type;
  const status = TRANSACTION_STATUS_LABEL[tx.status] ?? tx.status;
  return {
    id: `transaction-${tx.id}`,
    type: 'transaction',
    title: tx.title,
    subtitle: `${type} · ${status}`,
    href: `/transactions/${tx.id}`,
    keywords: [
      tx.propertyName ?? '',
      tx.leadName ?? '',
      type,
      status,
      tx.captorId,
      tx.sellerId ?? '',
    ],
  };
}

export function hitFromAppointment(
  appointment: CalendarAppointment,
): GlobalSearchHit {
  const when = appointment.date
    ? `${appointment.date}${appointment.startTime ? ` ${appointment.startTime}` : ''}`
    : undefined;
  const params = new URLSearchParams();
  if (appointment.date) params.set('date', appointment.date);
  params.set('appointmentId', appointment.id);
  return {
    id: `appointment-${appointment.id}`,
    type: 'appointment',
    title: appointment.title,
    subtitle: [appointment.leadName, when].filter(Boolean).join(' · ') || undefined,
    href: `/calendar?${params.toString()}`,
    keywords: [
      appointment.leadName ?? '',
      appointment.location ?? '',
      appointment.description ?? '',
      appointment.kind,
    ],
  };
}

export function hitFromNav(item: NavItem): GlobalSearchHit {
  return {
    id: `nav-${item.href}`,
    type: 'nav',
    title: item.label,
    subtitle: item.href === '/' ? 'Início' : item.href,
    href: item.href,
    keywords: [item.label, item.href],
  };
}

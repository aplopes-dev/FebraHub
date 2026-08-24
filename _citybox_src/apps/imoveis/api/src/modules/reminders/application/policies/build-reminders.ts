import type { AppointmentEntity } from '../../../appointments/domain/entities/appointment.entity';
import type { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import type { ApiLeadSource } from '../../../leads/domain/mappers/lead-enum.mapper';

export type ReminderKind =
  | 'follow-up'
  | 'visit'
  | 'signing'
  | 'other'
  | 'new-lead'
  | 'document';

export type ReminderPerson = {
  id: string;
  name: string;
  initials: string;
};

export type Reminder = {
  kind: ReminderKind;
  title: string;
  description: string;
  progress: number;
  people?: ReminderPerson[];
  totalPeople?: number;
  isHighlighted?: boolean;
  href?: string;
};

const REMINDER_AVATARS = 4;

/** Janela em que um lead `new` de site/WhatsApp gera notificação (dias). */
export const INBOUND_NEW_LEAD_WINDOW_DAYS = 7;

/** Máximo de cards individuais de novo lead no sino. */
export const INBOUND_NEW_LEAD_CAP = 10;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function peopleFromAppointments(
  appointments: readonly AppointmentEntity[],
): ReminderPerson[] {
  const byId = new Map<string, ReminderPerson>();
  for (const item of appointments) {
    if (!item.leadName) continue;
    const id = item.leadId ?? item.id;
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      name: item.leadName,
      initials: initialsFromName(item.leadName),
    });
  }
  return [...byId.values()];
}

export function inboundLeadSourceLabel(source: ApiLeadSource): string {
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'website') return 'site';
  return source;
}

/**
 * Card de notificação por lead novo (catálogo/site ou WhatsApp).
 * `href` aponta para o detalhe; fingerprint usa título+descrição no web.
 */
export function reminderFromInboundLead(lead: LeadEntity): Reminder {
  const channel = inboundLeadSourceLabel(lead.leadSource);
  return {
    kind: 'new-lead',
    title: 'Novo lead',
    description:
      channel === 'WhatsApp'
        ? `${lead.name} entrou pelo WhatsApp`
        : `${lead.name} entrou pelo site`,
    progress: 100,
    people: [
      {
        id: lead.id,
        name: lead.name,
        initials: initialsFromName(lead.name),
      },
    ],
    totalPeople: 1,
    isHighlighted: true,
    href: `/leads/${lead.id}`,
  };
}

/**
 * Agrega cards de lembrete (novos leads inbound + follow-ups + compromissos).
 * Fonte única para dashboard overview e GET /v1/reminders.
 */
export function buildReminders(
  followUpLeads: { items: LeadEntity[]; total: number },
  appointments: readonly AppointmentEntity[],
  inboundNewLeads: readonly LeadEntity[] = [],
  extra: readonly Reminder[] = [],
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const lead of inboundNewLeads) {
    if (lead.leadSource !== 'website' && lead.leadSource !== 'whatsapp') {
      continue;
    }
    reminders.push(reminderFromInboundLead(lead));
  }

  if (followUpLeads.total > 0) {
    reminders.push({
      kind: 'follow-up',
      title: 'Follow-ups',
      description:
        followUpLeads.total === 1
          ? '1 lead precisa de retorno'
          : `${followUpLeads.total} leads precisam de retorno`,
      progress: Math.min(100, followUpLeads.total * 20),
      people: followUpLeads.items.map((lead) => ({
        id: lead.id,
        name: lead.name,
        initials: initialsFromName(lead.name),
      })),
      totalPeople: followUpLeads.total,
      isHighlighted: true,
      href: '/leads',
    });
  }

  const byKind = new Map<string, AppointmentEntity[]>();
  for (const item of appointments) {
    const existing = byKind.get(item.kind);
    if (existing) {
      existing.push(item);
    } else {
      byKind.set(item.kind, [item]);
    }
  }

  const order: Array<{
    kind: 'visit' | 'follow-up' | 'signing' | 'other';
    reminderKind: ReminderKind;
    title: string;
    one: string;
    many: (n: number) => string;
    href?: string;
  }> = [
    {
      kind: 'visit',
      reminderKind: 'visit',
      title: 'Visitas',
      one: '1 visita nos próximos 7 dias',
      many: (n) => `${n} visitas nos próximos 7 dias`,
      href: '/calendar',
    },
    {
      kind: 'follow-up',
      reminderKind: 'follow-up',
      title: 'Follow-ups agendados',
      one: '1 follow-up nos próximos 7 dias',
      many: (n) => `${n} follow-ups nos próximos 7 dias`,
      href: '/calendar',
    },
    {
      kind: 'signing',
      reminderKind: 'signing',
      title: 'Assinatura',
      one: '1 assinatura nos próximos 7 dias',
      many: (n) => `${n} assinaturas nos próximos 7 dias`,
      href: '/calendar',
    },
    {
      kind: 'other',
      reminderKind: 'other',
      title: 'Outros',
      one: '1 compromisso nos próximos 7 dias',
      many: (n) => `${n} compromissos nos próximos 7 dias`,
      href: '/calendar',
    },
  ];

  for (const meta of order) {
    const group = byKind.get(meta.kind);
    if (!group || group.length === 0) continue;
    const people = peopleFromAppointments(group);
    reminders.push({
      kind: meta.reminderKind,
      title: meta.title,
      description: group.length === 1 ? meta.one : meta.many(group.length),
      progress: Math.min(100, group.length * 20),
      people: people.slice(0, REMINDER_AVATARS),
      totalPeople: people.length,
      href: meta.href,
    });
  }

  reminders.push(...extra);
  return reminders;
}

export { REMINDER_AVATARS };

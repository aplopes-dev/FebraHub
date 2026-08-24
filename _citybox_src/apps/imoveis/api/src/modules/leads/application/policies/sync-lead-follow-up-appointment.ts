import { Logger } from '@nestjs/common';
import type { LeadEntity } from '../../domain/entities/lead.entity';
import type { AppointmentEntity } from '../../../appointments/domain/entities/appointment.entity';
import { AppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository.interface';
import type { GoogleCalendarService } from '../../../google-calendar/infrastructure/google-calendar.service';

/** Alinhado a `MAX_APPOINTMENT_DESCRIPTION` da agenda. */
const MAX_FOLLOW_UP_DESCRIPTION = 40;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_FOLLOW_UP_DESCRIPTION = 'Retornar contato';
const FOLLOW_UP_START_HOUR = '09:00';
const FOLLOW_UP_END_HOUR = '10:00';
const BAHIA_OFFSET = '-03:00';

const logger = new Logger('syncLeadFollowUpAppointment');

/** Extrai `YYYY-MM-DD` de string ou Date (coluna `@db.Date`). */
export function toFollowUpDateOnly(
  value: string | Date | null | undefined,
): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const slice = trimmed.slice(0, 10);
    return DATE_ONLY_RE.test(slice) ? slice : null;
  }
  // Prisma Date @db.Date chega como UTC midnight do dia civil.
  return value.toISOString().slice(0, 10);
}

export function briefFollowUpDescription(notes?: string | null): string {
  const trimmed = (notes ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return DEFAULT_FOLLOW_UP_DESCRIPTION;
  if (trimmed.length <= MAX_FOLLOW_UP_DESCRIPTION) return trimmed;
  return `${trimmed.slice(0, MAX_FOLLOW_UP_DESCRIPTION - 1)}…`;
}

function resolveAgentId(lead: LeadEntity): string | null {
  const fromList = lead.agentIds.find((id) => id.trim().length > 0)?.trim();
  if (fromList) return fromList;
  const primary = lead.agentId?.trim();
  return primary || null;
}

function bahiaIso(dateOnly: string, timeHhMm: string): string {
  return `${dateOnly}T${timeHhMm}:00.000${BAHIA_OFFSET}`;
}

async function softDeleteGoogleEvent(
  googleCalendar: GoogleCalendarService | undefined,
  storeId: string,
  agentId: string,
  googleEventId: string | null | undefined,
): Promise<void> {
  if (!googleCalendar || !googleEventId) return;
  try {
    await googleCalendar.deleteEventForAgent({
      storeId,
      agentId,
      googleEventId,
    });
  } catch (error) {
    logger.warn(
      `[follow-up] falha ao remover Google event=${googleEventId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function softLinkGoogleEvent(
  appointments: AppointmentRepository,
  googleCalendar: GoogleCalendarService | undefined,
  appointment: AppointmentEntity,
): Promise<void> {
  if (!googleCalendar) return;

  let eventId: string | null = null;
  try {
    eventId = await googleCalendar.upsertEventForAgent({
      storeId: appointment.storeId,
      agentId: appointment.agentId,
      appointment,
    });
  } catch (error) {
    logger.warn(
      `[follow-up] Google upsert threw appointment=${appointment.id}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return;
  }

  if (eventId === appointment.googleEventId) return;
  if (eventId === null && !appointment.googleEventId) return;

  try {
    await appointments.setGoogleEventId(
      appointment.storeId,
      appointment.id,
      eventId,
    );
  } catch (error) {
    logger.warn(
      `[follow-up] falha ao gravar googleEventId appointment=${appointment.id}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Garante compromisso `follow-up` na agenda quando o lead tem
 * próximo follow-up + corretor atribuído. Sem data/agente, remove o
 * follow-up pendente vinculado ao lead (se houver).
 *
 * Soft-sync no Google Calendar do corretor do follow-up (mesmo padrão das visitas).
 */
export async function syncLeadFollowUpAppointment(
  appointments: AppointmentRepository,
  lead: LeadEntity,
  googleCalendar?: GoogleCalendarService,
): Promise<void> {
  const dateOnly = toFollowUpDateOnly(lead.nextFollowUp);
  const agentId = resolveAgentId(lead);
  const existing = await appointments.findOpenFollowUpByLeadId(
    lead.storeId,
    lead.id,
  );

  if (!dateOnly || !agentId) {
    if (existing) {
      await softDeleteGoogleEvent(
        googleCalendar,
        lead.storeId,
        existing.agentId,
        existing.googleEventId,
      );
      await appointments.delete(lead.storeId, existing.id);
    }
    return;
  }

  const payload = {
    storeId: lead.storeId,
    title: lead.name.trim() || 'Follow-up',
    description: briefFollowUpDescription(lead.notes),
    startsAt: new Date(bahiaIso(dateOnly, FOLLOW_UP_START_HOUR)),
    endsAt: new Date(bahiaIso(dateOnly, FOLLOW_UP_END_HOUR)),
    location: '',
    kind: 'follow-up' as const,
    agentId,
    done: false,
    leadId: lead.id,
    leadName: lead.name.trim() || null,
    leadEmail: lead.email?.trim() || null,
    leadPhone: lead.phone?.trim() || null,
    leadPhotoUrl: lead.photoUrl ?? null,
    propertyId: null,
  };

  if (existing) {
    const agentChanged = existing.agentId !== agentId;
    if (agentChanged && existing.googleEventId) {
      await softDeleteGoogleEvent(
        googleCalendar,
        lead.storeId,
        existing.agentId,
        existing.googleEventId,
      );
    }

    const updated = await appointments.update(lead.storeId, existing.id, {
      ...payload,
      googleEventId: agentChanged ? null : existing.googleEventId,
    });
    if (updated) {
      await softLinkGoogleEvent(appointments, googleCalendar, updated);
    }
    return;
  }

  const created = await appointments.create(payload);
  await softLinkGoogleEvent(appointments, googleCalendar, created);
}

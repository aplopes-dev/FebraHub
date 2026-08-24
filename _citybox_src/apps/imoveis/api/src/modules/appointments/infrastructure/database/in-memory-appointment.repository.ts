import { randomUUID } from 'crypto';
import {
  AppointmentEntity,
  type AppointmentProps,
} from '../../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  type AppointmentWritePayload,
  type ListAppointmentsFilters,
  type ListAppointmentsResult,
} from '../../domain/repositories/appointment.repository.interface';

function toProps(
  payload: Omit<AppointmentWritePayload, 'storeId'> & { storeId: string },
  existing?: AppointmentEntity,
): AppointmentProps {
  const now = new Date();
  return {
    storeId: payload.storeId,
    title: payload.title.trim(),
    description: (payload.description ?? existing?.description ?? '').trim(),
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    location: (payload.location ?? existing?.location ?? '').trim(),
    kind: payload.kind,
    agentId: payload.agentId.trim(),
    done: payload.done ?? existing?.done ?? false,
    leadId:
      payload.leadId !== undefined
        ? payload.leadId
        : (existing?.leadId ?? null),
    leadName:
      payload.leadName !== undefined
        ? payload.leadName
        : (existing?.leadName ?? null),
    leadEmail:
      payload.leadEmail !== undefined
        ? payload.leadEmail
        : (existing?.leadEmail ?? null),
    leadPhone:
      payload.leadPhone !== undefined
        ? payload.leadPhone
        : (existing?.leadPhone ?? null),
    leadPhotoUrl:
      payload.leadPhotoUrl !== undefined
        ? payload.leadPhotoUrl
        : (existing?.leadPhotoUrl ?? null),
    propertyId:
      payload.propertyId !== undefined
        ? payload.propertyId
        : (existing?.propertyId ?? null),
    googleEventId:
      payload.googleEventId !== undefined
        ? payload.googleEventId
        : (existing?.googleEventId ?? null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryAppointmentRepository extends AppointmentRepository {
  private readonly items = new Map<string, AppointmentEntity>();

  async findMany(
    storeId: string,
    filters: ListAppointmentsFilters,
  ): Promise<ListAppointmentsResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((a) => a.storeId === storeId);

    rows = rows.filter(
      (a) =>
        a.startsAt.getTime() < filters.toExclusive.getTime() &&
        a.endsAt.getTime() > filters.from.getTime(),
    );

    if (filters.agentId) {
      rows = rows.filter((a) => a.agentId === filters.agentId);
    }
    if (filters.excludeAgentId) {
      rows = rows.filter((a) => a.agentId !== filters.excludeAgentId);
    }
    if (filters.kind?.length) {
      rows = rows.filter((a) => filters.kind!.includes(a.kind));
    }
    if (filters.done !== undefined) {
      rows = rows.filter((a) => a.done === filters.done);
    }

    rows.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentEntity | null> {
    await Promise.resolve();
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findOpenFollowUpByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<AppointmentEntity | null> {
    await Promise.resolve();
    const matches = [...this.items.values()]
      .filter(
        (a) =>
          a.storeId === storeId &&
          a.leadId === leadId &&
          a.kind === 'follow-up' &&
          !a.done,
      )
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    return matches[0] ?? null;
  }

  async create(payload: AppointmentWritePayload): Promise<AppointmentEntity> {
    await Promise.resolve();
    const id = randomUUID();
    const entity = AppointmentEntity.create(toProps(payload), id);
    this.items.set(id, entity);
    return entity;
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<AppointmentWritePayload, 'storeId'>,
  ): Promise<AppointmentEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const next = AppointmentEntity.create(
      toProps({ ...payload, storeId }, existing),
      id,
    );
    this.items.set(id, next);
    return next;
  }

  async setGoogleEventId(
    storeId: string,
    id: string,
    googleEventId: string | null,
  ): Promise<AppointmentEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const next = existing.with({ googleEventId, updatedAt: new Date() });
    this.items.set(id, next);
    return next;
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const existing = await this.findById(storeId, id);
    if (!existing) return false;
    this.items.delete(id);
    return true;
  }
}

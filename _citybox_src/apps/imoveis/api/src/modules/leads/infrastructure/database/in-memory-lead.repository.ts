import { randomUUID } from 'crypto';
import { LeadEntity } from '../../domain/entities/lead.entity';
import {
  LeadRepository,
  type LeadWritePayload,
  type ListLeadsFilters,
  type ListLeadsResult,
} from '../../domain/repositories/lead.repository.interface';
import {
  normalizePaymentIntents,
  type ApiLeadActivityType,
  type ApiLeadStatus,
} from '../../domain/mappers/lead-enum.mapper';
import { toLeadDocumentProps } from '../../domain/mappers/lead-document.mapper';

function parseDateOnly(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateValue(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchesSearch(lead: LeadEntity, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const haystack = [
    lead.name,
    lead.email,
    lead.phone,
    lead.preferredLocation,
    lead.city,
    lead.state,
    lead.propertyName ?? '',
    lead.budgetRange,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryLeadRepository extends LeadRepository {
  private readonly items = new Map<string, LeadEntity>();
  private readonly uploadTokens = new Map<
    string,
    { leadId: string; expiresAt: Date }
  >();

  async findMany(
    storeId: string,
    filters: ListLeadsFilters,
  ): Promise<ListLeadsResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((l) => l.storeId === storeId);
    if (filters.status?.length) {
      rows = rows.filter((l) => filters.status!.includes(l.status));
    }
    if (filters.leadSource?.length) {
      rows = rows.filter((l) => filters.leadSource!.includes(l.leadSource));
    }
    if (filters.purpose?.length) {
      rows = rows.filter((l) => filters.purpose!.includes(l.purpose));
    }
    if (filters.interestedPropertyType?.length) {
      rows = rows.filter((l) =>
        filters.interestedPropertyType!.includes(l.interestedPropertyType),
      );
    }
    if (filters.agentId) {
      // Só dono primário — alinhado ao Prisma (não usa agentIds de co-designação).
      rows = rows.filter((l) => l.agentId === filters.agentId);
    }
    if (filters.followUpUntil) {
      const limit = filters.followUpUntil.getTime();
      rows = rows.filter(
        (l) => l.nextFollowUp != null && l.nextFollowUp.getTime() <= limit,
      );
    }
    if (filters.createdAtFrom) {
      const from = filters.createdAtFrom.getTime();
      rows = rows.filter((l) => l.createdAt.getTime() >= from);
    }
    rows = rows.filter((l) => matchesSearch(l, filters.search));
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(storeId: string, id: string): Promise<LeadEntity | null> {
    await Promise.resolve();
    const lead = this.items.get(id);
    if (!lead || lead.storeId !== storeId) return null;
    return lead;
  }

  async create(payload: LeadWritePayload): Promise<LeadEntity> {
    await Promise.resolve();
    const id = randomUUID();
    const now = new Date();
    const agentIds = [...new Set(payload.agentIds ?? [])];
    const matched = payload.matchedProperties ?? [];
    const documents = payload.documents ?? [];
    const activities = payload.activities ?? [];

    const lead = LeadEntity.create(
      {
        storeId: payload.storeId,
        name: payload.name.trim(),
        email: payload.email?.trim() ?? '',
        phone: payload.phone?.trim() ?? '',
        city: payload.city?.trim() ?? '',
        state: payload.state?.trim() ?? '',
        status: payload.status,
        leadSource: payload.leadSource,
        interestedPropertyType: payload.interestedPropertyType,
        budgetRange: payload.budgetRange?.trim() ?? '',
        preferredLocation: payload.preferredLocation?.trim() ?? '',
        purpose: payload.purpose,
        paymentIntents: normalizePaymentIntents(payload.paymentIntents),
        latestFollowUp: parseDateOnly(payload.latestFollowUp ?? null),
        nextFollowUp: parseDateOnly(payload.nextFollowUp ?? null),
        notes: payload.notes ?? '',
        photoUrl: payload.photoUrl || null,
        propertyName: payload.propertyName?.trim() || null,
        hasSuggestion: payload.hasSuggestion ?? false,
        agentId: payload.agentId ?? agentIds[0] ?? null,
        agentIds,
        matchedProperties: matched.map((p, index) => ({
          id: randomUUID(),
          propertyId: p.id,
          propertyName: p.name,
          sortOrder: index,
        })),
        documents: documents.map((d) =>
          toLeadDocumentProps({
            id: d.id || randomUUID(),
            name: d.name,
            sizeLabel: d.sizeLabel,
            kind: d.kind === 'contract' ? 'contract' : 'other',
            addedAt: parseDateOnly(d.addedAt) ?? now,
            objectKey: d.objectKey ?? null,
            mimeType: d.mimeType ?? null,
            sentAt: parseDateValue(d.sentAt),
            sentChannel: d.sentChannel,
            shareToken: d.shareToken,
            shareExpiresAt: parseDateValue(d.shareExpiresAt),
            viewedAt: parseDateValue(d.viewedAt),
          }),
        ),
        activities: [
          {
            id: randomUUID(),
            type: 'system',
            message: 'Lead criado.',
            createdAt: now,
          },
          ...activities.map((a) => ({
            id: a.id || randomUUID(),
            type: a.type as ApiLeadActivityType,
            message: a.message,
            authorName: a.authorName,
            createdAt: a.createdAt ? new Date(a.createdAt) : now,
          })),
        ],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
    this.items.set(id, lead);
    return lead;
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<LeadWritePayload, 'storeId'>,
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const agentIds = [...new Set(payload.agentIds ?? [])];
    const matched = payload.matchedProperties ?? [];
    const documents = payload.documents ?? [];
    const now = new Date();

    const next = existing.with({
      name: payload.name.trim(),
      email: payload.email?.trim() ?? '',
      phone: payload.phone?.trim() ?? '',
      city: payload.city?.trim() ?? '',
      state: payload.state?.trim() ?? '',
      status: payload.status,
      leadSource: payload.leadSource,
      interestedPropertyType: payload.interestedPropertyType,
      budgetRange: payload.budgetRange?.trim() ?? '',
      preferredLocation: payload.preferredLocation?.trim() ?? '',
      purpose: payload.purpose,
      paymentIntents: normalizePaymentIntents(payload.paymentIntents),
      latestFollowUp: parseDateOnly(payload.latestFollowUp ?? null),
      nextFollowUp: parseDateOnly(payload.nextFollowUp ?? null),
      notes: payload.notes ?? '',
      photoUrl: payload.photoUrl || null,
      propertyName: payload.propertyName?.trim() || null,
      hasSuggestion: payload.hasSuggestion ?? false,
      agentId:
        payload.agentId !== undefined
          ? payload.agentId
          : (agentIds[0] ?? existing.agentId),
      agentIds,
      matchedProperties: matched.map((p, index) => ({
        id: randomUUID(),
        propertyId: p.id,
        propertyName: p.name,
        sortOrder: index,
      })),
      documents: documents.map((d) => {
        const previous = d.id
          ? existing.documents.find((item) => item.id === d.id)
          : undefined;
        return toLeadDocumentProps({
          id: d.id || randomUUID(),
          name: d.name,
          sizeLabel: d.sizeLabel,
          kind: d.kind === 'contract' ? 'contract' : 'other',
          addedAt: parseDateOnly(d.addedAt) ?? now,
          objectKey: d.objectKey ?? previous?.objectKey ?? null,
          mimeType: d.mimeType ?? previous?.mimeType ?? null,
          sentAt: parseDateValue(d.sentAt) ?? previous?.sentAt ?? null,
          sentChannel: d.sentChannel ?? previous?.sentChannel ?? null,
          shareToken: d.shareToken ?? previous?.shareToken ?? null,
          shareExpiresAt:
            parseDateValue(d.shareExpiresAt) ?? previous?.shareExpiresAt ?? null,
          viewedAt: parseDateValue(d.viewedAt) ?? previous?.viewedAt ?? null,
        });
      }),
      activities: payload.activities
        ? payload.activities.map((a) => ({
            id: a.id || randomUUID(),
            type: a.type as ApiLeadActivityType,
            message: a.message,
            authorName: a.authorName,
            createdAt: a.createdAt ? new Date(a.createdAt) : now,
          }))
        : existing.activities,
      updatedAt: now,
    });
    this.items.set(id, next);
    return next;
  }

  async addDocument(
    storeId: string,
    leadId: string,
    document: {
      id: string;
      name: string;
      sizeLabel: string;
      kind: 'contract' | 'other';
      addedAt: Date;
      objectKey: string | null;
      mimeType: string | null;
    },
    activityMessage?: string,
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, leadId);
    if (!existing) return null;
    const now = new Date();
    const next = existing.with({
      documents: [
        ...existing.documents,
        toLeadDocumentProps({
          ...document,
          sentAt: null,
          sentChannel: null,
          shareToken: null,
          shareExpiresAt: null,
        }),
      ],
      activities: activityMessage
        ? [
            ...existing.activities,
            {
              id: randomUUID(),
              type: 'document',
              message: activityMessage,
              createdAt: now,
            },
          ]
        : existing.activities,
      updatedAt: now,
    });
    this.items.set(leadId, next);
    return next;
  }

  async markDocumentSent(
    storeId: string,
    leadId: string,
    documentId: string,
    payload: {
      sentAt: Date;
      sentChannel: 'whatsapp' | 'share' | 'link';
      shareToken: string;
      shareExpiresAt: Date;
      activityMessage: string;
    },
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, leadId);
    if (!existing) return null;
    const document = existing.documents.find((d) => d.id === documentId);
    if (!document) return null;
    const now = new Date();
    const next = existing.with({
      documents: existing.documents.map((d) =>
        d.id === documentId
          ? {
              ...d,
              sentAt: payload.sentAt,
              sentChannel: payload.sentChannel,
              shareToken: payload.shareToken,
              shareExpiresAt: payload.shareExpiresAt,
            }
          : d,
      ),
      activities: [
        ...existing.activities,
        {
          id: randomUUID(),
          type: 'document',
          message: payload.activityMessage,
          createdAt: now,
        },
      ],
      updatedAt: now,
    });
    this.items.set(leadId, next);
    return next;
  }

  async findDocument(
    storeId: string,
    leadId: string,
    documentId: string,
  ): Promise<LeadEntity['documents'][number] | null> {
    const lead = await this.findById(storeId, leadId);
    return lead?.documents.find((d) => d.id === documentId) ?? null;
  }

  async findDocumentByShareToken(
    token: string,
  ): Promise<{
    storeId: string;
    leadId: string;
    document: LeadEntity['documents'][number];
  } | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    for (const lead of this.items.values()) {
      const document = lead.documents.find((d) => d.shareToken === trimmed);
      if (document) {
        return { storeId: lead.storeId, leadId: lead.id, document };
      }
    }
    return null;
  }

  async markDocumentViewedIfUnset(
    documentId: string,
    viewedAt: Date,
  ): Promise<Date | null> {
    for (const [id, lead] of this.items) {
      const document = lead.documents.find((d) => d.id === documentId);
      if (!document) continue;
      if (document.viewedAt) return document.viewedAt;
      const next = lead.with({
        documents: lead.documents.map((d) =>
          d.id === documentId ? { ...d, viewedAt } : d,
        ),
      });
      this.items.set(id, next);
      return viewedAt;
    }
    return null;
  }

  async setDocumentUploadToken(
    storeId: string,
    leadId: string,
    payload: { token: string; expiresAt: Date },
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, leadId);
    if (!existing) return null;
    for (const [token, entry] of this.uploadTokens) {
      if (entry.leadId === leadId) this.uploadTokens.delete(token);
    }
    this.uploadTokens.set(payload.token, {
      leadId,
      expiresAt: payload.expiresAt,
    });
    return existing;
  }

  async findByDocumentUploadToken(token: string): Promise<LeadEntity | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const entry = this.uploadTokens.get(trimmed);
    if (!entry) return null;
    if (entry.expiresAt.getTime() <= Date.now()) return null;
    return this.items.get(entry.leadId) ?? null;
  }

  async clearPropertyLinks(
    storeId: string,
    leadId: string,
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, leadId);
    if (!existing) return null;
    if (existing.matchedProperties.length === 0 && !existing.propertyName) {
      return existing;
    }
    const next = existing.with({
      propertyName: null,
      matchedProperties: [],
      updatedAt: new Date(),
    });
    this.items.set(leadId, next);
    return next;
  }

  async updateStatus(
    storeId: string,
    id: string,
    status: ApiLeadStatus,
    activityMessage: string,
  ): Promise<LeadEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const next = existing.with({
      status,
      activities: [
        {
          id: randomUUID(),
          type: 'status',
          message: activityMessage,
          createdAt: new Date(),
        },
        ...existing.activities,
      ],
      updatedAt: new Date(),
    });
    this.items.set(id, next);
    return next;
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const existing = await this.findById(storeId, id);
    if (!existing) return false;
    this.items.delete(id);
    return true;
  }

  async syncAgentCatalog(
    storeId: string,
    agentId: string,
    leadIds: string[],
    fallbackAgentId: string,
  ): Promise<void> {
    await Promise.resolve();
    const selected = new Set(leadIds);
    for (const lead of this.items.values()) {
      if (lead.storeId !== storeId) continue;
      if (selected.has(lead.id)) {
        if (lead.agentId !== agentId) {
          this.items.set(
            lead.id,
            lead.with({ agentId, updatedAt: new Date() }),
          );
        }
      } else if (lead.agentId === agentId) {
        this.items.set(
          lead.id,
          lead.with({ agentId: fallbackAgentId, updatedAt: new Date() }),
        );
      }
    }
  }
}

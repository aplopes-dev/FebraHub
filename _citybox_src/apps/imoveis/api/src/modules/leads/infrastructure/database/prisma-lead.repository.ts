import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { LeadEntity } from '../../domain/entities/lead.entity';
import {
  LeadRepository,
  type LeadWritePayload,
  type ListLeadsFilters,
  type ListLeadsResult,
} from '../../domain/repositories/lead.repository.interface';
import {
  paymentIntentsToApi,
  paymentIntentsToPrisma,
  sourceToApi,
  sourceToPrisma,
  statusToApi,
  statusToPrisma,
  type ApiLeadActivityType,
  type ApiLeadStatus,
} from '../../domain/mappers/lead-enum.mapper';
import { coverPhotoMapFromRows } from './lead-matched-property-cover';
import { toLeadDocumentProps } from '../../domain/mappers/lead-document.mapper';

type LeadRow = Prisma.LeadGetPayload<{
  include: {
    agents: true;
    matchedProperties: true;
    documents: true;
    activities: true;
  };
}>;

const leadInclude = {
  agents: true,
  matchedProperties: { orderBy: { sortOrder: 'asc' as const } },
  documents: { orderBy: { addedAt: 'desc' as const } },
  activities: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.LeadInclude;

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

@Injectable()
export class PrismaLeadRepository extends LeadRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListLeadsFilters,
  ): Promise<ListLeadsResult> {
    const where = this.buildWhere(storeId, filters);
    const skip = (filters.page - 1) * filters.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.perPage,
      }),
      this.prisma.lead.count({ where }),
    ]);
    const coverMap = await this.loadCoverPhotoUrls(
      storeId,
      this.collectPropertyIds(rows),
    );
    return {
      items: rows.map((row) => this.toEntity(row, coverMap)),
      total,
    };
  }

  async findById(storeId: string, id: string): Promise<LeadEntity | null> {
    const row = await this.prisma.lead.findFirst({
      where: { id, storeId },
      include: leadInclude,
    });
    if (!row) return null;
    const coverMap = await this.loadCoverPhotoUrls(
      storeId,
      row.matchedProperties.map((p) => p.propertyId),
    );
    return this.toEntity(row, coverMap);
  }

  async create(payload: LeadWritePayload): Promise<LeadEntity> {
    const id = randomUUID();
    const now = new Date();
    const agentIds = [...new Set(payload.agentIds ?? [])];
    const matched = payload.matchedProperties ?? [];
    const documents = payload.documents ?? [];
    const activities = payload.activities ?? [];

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.create({
        data: {
          id,
          storeId: payload.storeId,
          name: payload.name.trim(),
          email: payload.email?.trim() ?? '',
          phone: payload.phone?.trim() ?? '',
          city: payload.city?.trim() ?? '',
          state: payload.state?.trim() ?? '',
          status: statusToPrisma(payload.status),
          leadSource: sourceToPrisma(payload.leadSource),
          interestedPropertyType: payload.interestedPropertyType,
          budgetRange: payload.budgetRange?.trim() ?? '',
          preferredLocation: payload.preferredLocation?.trim() ?? '',
          purpose: payload.purpose,
          paymentIntents: paymentIntentsToPrisma(payload.paymentIntents),
          latestFollowUp: parseDateOnly(payload.latestFollowUp),
          nextFollowUp: parseDateOnly(payload.nextFollowUp),
          notes: payload.notes ?? '',
          photoUrl: payload.photoUrl || null,
          propertyName: payload.propertyName?.trim() || null,
          hasSuggestion: payload.hasSuggestion ?? false,
          agentId: payload.agentId ?? agentIds[0] ?? null,
        },
      });

      if (agentIds.length > 0) {
        await tx.leadAgent.createMany({
          data: agentIds.map((agentId) => ({
            id: randomUUID(),
            leadId: id,
            agentId,
          })),
        });
      }

      if (matched.length > 0) {
        await tx.leadMatchedProperty.createMany({
          data: matched.map((p, index) => ({
            id: randomUUID(),
            leadId: id,
            propertyId: p.id,
            propertyName: p.name,
            sortOrder: index,
          })),
        });
      }

      if (documents.length > 0) {
        await tx.leadDocument.createMany({
          data: documents.map((d) => ({
            id: d.id || randomUUID(),
            leadId: id,
            name: d.name,
            sizeLabel: d.sizeLabel,
            kind: d.kind === 'contract' ? 'contract' : 'other',
            addedAt: parseDateOnly(d.addedAt) ?? now,
            objectKey: d.objectKey ?? null,
            mimeType: d.mimeType ?? null,
            sentAt: parseDateValue(d.sentAt),
            sentChannel: d.sentChannel ?? null,
            shareToken: d.shareToken ?? null,
            shareExpiresAt: parseDateValue(d.shareExpiresAt),
            viewedAt: parseDateValue(d.viewedAt),
          })),
        });
      }

      const activityRows = [
        {
          id: randomUUID(),
          leadId: id,
          type: 'system' as const,
          message: 'Lead criado.',
          authorName: null as string | null,
          createdAt: now,
        },
        ...activities.map((a) => ({
          id: a.id || randomUUID(),
          leadId: id,
          type: a.type as ApiLeadActivityType,
          message: a.message,
          authorName: a.authorName ?? null,
          createdAt: a.createdAt ? new Date(a.createdAt) : now,
        })),
      ];
      await tx.leadActivity.createMany({ data: activityRows });
    });

    const created = await this.findById(payload.storeId, id);
    if (!created) throw new Error('Lead create failed');
    return created;
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<LeadWritePayload, 'storeId'>,
  ): Promise<LeadEntity | null> {
    const existing = await this.prisma.lead.findFirst({
      where: { id, storeId },
    });
    if (!existing) return null;

    const agentIds = [...new Set(payload.agentIds ?? [])];
    const matched = payload.matchedProperties ?? [];
    const documents = payload.documents ?? [];
    const activities = payload.activities;

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: {
          name: payload.name.trim(),
          email: payload.email?.trim() ?? '',
          phone: payload.phone?.trim() ?? '',
          city: payload.city?.trim() ?? '',
          state: payload.state?.trim() ?? '',
          status: statusToPrisma(payload.status),
          leadSource: sourceToPrisma(payload.leadSource),
          interestedPropertyType: payload.interestedPropertyType,
          budgetRange: payload.budgetRange?.trim() ?? '',
          preferredLocation: payload.preferredLocation?.trim() ?? '',
          purpose: payload.purpose,
          paymentIntents: paymentIntentsToPrisma(payload.paymentIntents),
          latestFollowUp: parseDateOnly(payload.latestFollowUp),
          nextFollowUp: parseDateOnly(payload.nextFollowUp),
          notes: payload.notes ?? '',
          photoUrl: payload.photoUrl || null,
          propertyName: payload.propertyName?.trim() || null,
          hasSuggestion: payload.hasSuggestion ?? false,
          agentId:
            payload.agentId !== undefined
              ? payload.agentId
              : (agentIds[0] ?? existing.agentId),
        },
      });

      await tx.leadAgent.deleteMany({ where: { leadId: id } });
      if (agentIds.length > 0) {
        await tx.leadAgent.createMany({
          data: agentIds.map((agentId) => ({
            id: randomUUID(),
            leadId: id,
            agentId,
          })),
        });
      }

      await tx.leadMatchedProperty.deleteMany({ where: { leadId: id } });
      if (matched.length > 0) {
        await tx.leadMatchedProperty.createMany({
          data: matched.map((p, index) => ({
            id: randomUUID(),
            leadId: id,
            propertyId: p.id,
            propertyName: p.name,
            sortOrder: index,
          })),
        });
      }

      const existingDocs = await tx.leadDocument.findMany({
        where: { leadId: id },
      });
      const existingById = new Map(existingDocs.map((d) => [d.id, d]));
      await tx.leadDocument.deleteMany({ where: { leadId: id } });
      if (documents.length > 0) {
        await tx.leadDocument.createMany({
          data: documents.map((d) => {
            const previous = d.id ? existingById.get(d.id) : undefined;
            return {
              id: d.id || randomUUID(),
              leadId: id,
              name: d.name,
              sizeLabel: d.sizeLabel,
              kind: d.kind === 'contract' ? 'contract' : 'other',
              addedAt: parseDateOnly(d.addedAt) ?? new Date(),
              objectKey: d.objectKey ?? previous?.objectKey ?? null,
              mimeType: d.mimeType ?? previous?.mimeType ?? null,
              sentAt: parseDateValue(d.sentAt) ?? previous?.sentAt ?? null,
              sentChannel: d.sentChannel ?? previous?.sentChannel ?? null,
              shareToken: d.shareToken ?? previous?.shareToken ?? null,
              shareExpiresAt:
                parseDateValue(d.shareExpiresAt) ??
                previous?.shareExpiresAt ??
                null,
              viewedAt: parseDateValue(d.viewedAt) ?? previous?.viewedAt ?? null,
            };
          }),
        });
      }

      if (activities) {
        await tx.leadActivity.deleteMany({ where: { leadId: id } });
        if (activities.length > 0) {
          await tx.leadActivity.createMany({
            data: activities.map((a) => ({
              id: a.id || randomUUID(),
              leadId: id,
              type: a.type as ApiLeadActivityType,
              message: a.message,
              authorName: a.authorName ?? null,
              createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            })),
          });
        }
      }
    });

    return this.findById(storeId, id);
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
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, storeId },
    });
    if (!existing) return null;
    await this.prisma.$transaction(async (tx) => {
      await tx.leadDocument.create({
        data: {
          id: document.id,
          leadId,
          name: document.name,
          sizeLabel: document.sizeLabel,
          kind: document.kind,
          addedAt: document.addedAt,
          objectKey: document.objectKey,
          mimeType: document.mimeType,
        },
      });
      if (activityMessage) {
        await tx.leadActivity.create({
          data: {
            id: randomUUID(),
            leadId,
            type: 'document',
            message: activityMessage,
          },
        });
      }
    });
    return this.findById(storeId, leadId);
  }

  async findDocument(
    storeId: string,
    leadId: string,
    documentId: string,
  ): Promise<LeadEntity['documents'][number] | null> {
    const row = await this.prisma.leadDocument.findFirst({
      where: { id: documentId, leadId, lead: { storeId } },
    });
    if (!row) return null;
    return toLeadDocumentProps({
      id: row.id,
      name: row.name,
      sizeLabel: row.sizeLabel,
      kind: row.kind === 'contract' ? 'contract' : 'other',
      addedAt: row.addedAt,
      objectKey: row.objectKey ?? null,
      mimeType: row.mimeType ?? null,
      sentAt: row.sentAt,
      sentChannel: row.sentChannel,
      shareToken: row.shareToken,
      shareExpiresAt: row.shareExpiresAt,
      viewedAt: row.viewedAt,
    });
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
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, storeId },
    });
    if (!existing) return null;
    const document = await this.prisma.leadDocument.findFirst({
      where: { id: documentId, leadId },
    });
    if (!document) return null;

    await this.prisma.$transaction(async (tx) => {
      await tx.leadDocument.update({
        where: { id: documentId },
        data: {
          sentAt: payload.sentAt,
          sentChannel: payload.sentChannel,
          shareToken: payload.shareToken,
          shareExpiresAt: payload.shareExpiresAt,
        },
      });
      await tx.leadActivity.create({
        data: {
          id: randomUUID(),
          leadId,
          type: 'document',
          message: payload.activityMessage,
        },
      });
    });

    return this.findById(storeId, leadId);
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
    const row = await this.prisma.leadDocument.findFirst({
      where: { shareToken: trimmed },
      include: { lead: { select: { storeId: true } } },
    });
    if (!row) return null;
    return {
      storeId: row.lead.storeId,
      leadId: row.leadId,
      document: toLeadDocumentProps({
        id: row.id,
        name: row.name,
        sizeLabel: row.sizeLabel,
        kind: row.kind === 'contract' ? 'contract' : 'other',
        addedAt: row.addedAt,
        objectKey: row.objectKey ?? null,
        mimeType: row.mimeType ?? null,
        sentAt: row.sentAt,
        sentChannel: row.sentChannel,
        shareToken: row.shareToken,
        shareExpiresAt: row.shareExpiresAt,
        viewedAt: row.viewedAt,
      }),
    };
  }

  async markDocumentViewedIfUnset(
    documentId: string,
    viewedAt: Date,
  ): Promise<Date | null> {
    const existing = await this.prisma.leadDocument.findUnique({
      where: { id: documentId },
      select: { id: true, viewedAt: true },
    });
    if (!existing) return null;
    if (existing.viewedAt) return existing.viewedAt;
    const updated = await this.prisma.leadDocument.update({
      where: { id: documentId },
      data: { viewedAt },
      select: { viewedAt: true },
    });
    return updated.viewedAt ?? viewedAt;
  }

  async setDocumentUploadToken(
    storeId: string,
    leadId: string,
    payload: { token: string; expiresAt: Date },
  ): Promise<LeadEntity | null> {
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, storeId },
      select: { id: true },
    });
    if (!existing) return null;
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        documentUploadToken: payload.token,
        documentUploadExpiresAt: payload.expiresAt,
      },
    });
    return this.findById(storeId, leadId);
  }

  async findByDocumentUploadToken(token: string): Promise<LeadEntity | null> {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const row = await this.prisma.lead.findFirst({
      where: {
        documentUploadToken: trimmed,
        documentUploadExpiresAt: { gt: new Date() },
      },
      include: leadInclude,
    });
    if (!row) return null;
    const coverMap = await this.loadCoverPhotoUrls(
      row.storeId,
      row.matchedProperties.map((p) => p.propertyId),
    );
    return this.toEntity(row, coverMap);
  }

  async updateStatus(
    storeId: string,
    id: string,
    status: ApiLeadStatus,
    activityMessage: string,
  ): Promise<LeadEntity | null> {
    const existing = await this.prisma.lead.findFirst({
      where: { id, storeId },
    });
    if (!existing) return null;

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: { status: statusToPrisma(status) },
      });
      await tx.leadActivity.create({
        data: {
          id: randomUUID(),
          leadId: id,
          type: 'status',
          message: activityMessage,
        },
      });
    });

    return this.findById(storeId, id);
  }

  async clearPropertyLinks(
    storeId: string,
    leadId: string,
  ): Promise<LeadEntity | null> {
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, storeId },
      include: { matchedProperties: true },
    });
    if (!existing) return null;

    if (existing.matchedProperties.length === 0 && !existing.propertyName) {
      return this.findById(storeId, leadId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.leadMatchedProperty.deleteMany({ where: { leadId } });
      await tx.lead.update({
        where: { id: leadId },
        data: { propertyName: null },
      });
    });

    return this.findById(storeId, leadId);
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const result = await this.prisma.lead.deleteMany({
      where: { id, storeId },
    });
    return result.count > 0;
  }

  async syncAgentCatalog(
    storeId: string,
    agentId: string,
    leadIds: string[],
    fallbackAgentId: string,
  ): Promise<void> {
    const selected = new Set(leadIds);
    const leads = await this.prisma.lead.findMany({
      where: { storeId },
      select: { id: true, agentId: true },
    });

    const ops = leads.flatMap((lead) => {
      if (selected.has(lead.id)) {
        if (lead.agentId === agentId) return [];
        return [
          this.prisma.lead.update({
            where: { id: lead.id },
            data: { agentId },
          }),
        ];
      }
      if (lead.agentId === agentId) {
        return [
          this.prisma.lead.update({
            where: { id: lead.id },
            data: { agentId: fallbackAgentId },
          }),
        ];
      }
      return [];
    });

    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }
  }

  private buildWhere(
    storeId: string,
    filters: ListLeadsFilters,
  ): Prisma.LeadWhereInput {
    const and: Prisma.LeadWhereInput[] = [{ storeId }];

    if (filters.status?.length) {
      and.push({
        status: { in: filters.status.map(statusToPrisma) },
      });
    }
    if (filters.leadSource?.length) {
      and.push({
        leadSource: { in: filters.leadSource.map(sourceToPrisma) },
      });
    }
    if (filters.purpose?.length) {
      and.push({ purpose: { in: filters.purpose } });
    }
    if (filters.interestedPropertyType?.length) {
      and.push({
        interestedPropertyType: { in: filters.interestedPropertyType },
      });
    }
    if (filters.agentId) {
      // Só dono primário — co-designados em lead_agents não entram na carteira
      // (evita KPI/listagem inflados por leads de outro corretor).
      and.push({ agentId: filters.agentId });
    }
    if (filters.followUpUntil) {
      and.push({ nextFollowUp: { not: null, lte: filters.followUpUntil } });
    }
    if (filters.createdAtFrom) {
      and.push({ createdAt: { gte: filters.createdAtFrom } });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { preferredLocation: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
          { propertyName: { contains: q, mode: 'insensitive' } },
          { budgetRange: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: and };
  }

  private collectPropertyIds(rows: readonly LeadRow[]): string[] {
    const ids = new Set<string>();
    for (const row of rows) {
      for (const matched of row.matchedProperties) {
        ids.add(matched.propertyId);
      }
    }
    return [...ids];
  }

  private async loadCoverPhotoUrls(
    storeId: string,
    propertyIds: readonly string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(propertyIds)];
    if (unique.length === 0) return new Map();

    const photos = await this.prisma.propertyPhoto.findMany({
      where: {
        propertyId: { in: unique },
        property: { storeId },
      },
      orderBy: [{ propertyId: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, propertyId: true },
    });

    return coverPhotoMapFromRows(photos);
  }

  private toEntity(
    row: LeadRow,
    coverMap: ReadonlyMap<string, string> = new Map(),
  ): LeadEntity {
    return LeadEntity.create(
      {
        storeId: row.storeId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        state: row.state,
        status: statusToApi(row.status),
        leadSource: sourceToApi(row.leadSource),
        interestedPropertyType: row.interestedPropertyType,
        budgetRange: row.budgetRange,
        preferredLocation: row.preferredLocation,
        purpose: row.purpose,
        paymentIntents: paymentIntentsToApi(row.paymentIntents),
        latestFollowUp: row.latestFollowUp,
        nextFollowUp: row.nextFollowUp,
        notes: row.notes,
        photoUrl: row.photoUrl,
        propertyName: row.propertyName,
        hasSuggestion: row.hasSuggestion,
        agentId: row.agentId,
        agentIds: row.agents.map((a) => a.agentId),
        matchedProperties: row.matchedProperties.map((p) => ({
          id: p.id,
          propertyId: p.propertyId,
          propertyName: p.propertyName,
          sortOrder: p.sortOrder,
          coverPhotoUrl: coverMap.get(p.propertyId) ?? null,
        })),
        documents: row.documents.map((d) =>
          toLeadDocumentProps({
            id: d.id,
            name: d.name,
            sizeLabel: d.sizeLabel,
            kind: d.kind === 'contract' ? 'contract' : 'other',
            addedAt: d.addedAt,
            objectKey: d.objectKey ?? null,
            mimeType: d.mimeType ?? null,
            sentAt: d.sentAt,
            sentChannel: d.sentChannel,
            shareToken: d.shareToken,
            shareExpiresAt: d.shareExpiresAt,
            viewedAt: d.viewedAt,
          }),
        ),
        activities: row.activities.map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          authorName: a.authorName ?? undefined,
          createdAt: a.createdAt,
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}

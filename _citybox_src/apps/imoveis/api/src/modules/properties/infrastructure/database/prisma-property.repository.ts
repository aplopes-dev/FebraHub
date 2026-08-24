import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { PropertyEntity } from '../../domain/entities/property.entity';
import {
  PropertyRepository,
  type ListPropertiesFilters,
  type ListPropertiesResult,
  type PropertyDocumentRecord,
  type PropertyPhotoRecord,
  type PropertyWritePayload,
} from '../../domain/repositories/property.repository.interface';
import {
  propertyStatusToApi,
  propertyStatusToPrisma,
  type ApiPropertyStatus,
} from '../../domain/mappers/property-enum.mapper';
import {
  normalizePropertyDescription,
  normalizePropertyHighlights,
} from '../../application/policies/normalize-property-catalog-copy';

type PropertyRow = Prisma.PropertyGetPayload<{
  include: {
    photos: true;
    documents: true;
    activeLeads: true;
  };
}>;

const propertyInclude = {
  photos: { orderBy: { sortOrder: 'asc' as const } },
  documents: { orderBy: { createdAt: 'desc' as const } },
  activeLeads: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.PropertyInclude;

@Injectable()
export class PrismaPropertyRepository extends PropertyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListPropertiesFilters,
  ): Promise<ListPropertiesResult> {
    const where = this.buildWhere(storeId, filters);
    const skip = (filters.page - 1) * filters.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: propertyInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.perPage,
      }),
      this.prisma.property.count({ where }),
    ]);
    return { items: rows.map((r) => this.toEntity(r)), total };
  }

  async findById(storeId: string, id: string): Promise<PropertyEntity | null> {
    const row = await this.prisma.property.findFirst({
      where: { id, storeId },
      include: propertyInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdGlobal(id: string): Promise<PropertyEntity | null> {
    const row = await this.prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async create(payload: PropertyWritePayload): Promise<PropertyEntity> {
    const id = randomUUID();
    const activeLeads = payload.activeLeads ?? [];

    await this.prisma.$transaction(async (tx) => {
      await tx.property.create({
        data: {
          id,
          storeId: payload.storeId,
          name: payload.name.trim(),
          city: payload.city?.trim() ?? '',
          state: payload.state?.trim() ?? '',
          type: payload.type,
          units: payload.units ?? 1,
          cost: payload.cost ?? 0,
          views: payload.views ?? 0,
          status: propertyStatusToPrisma(payload.status),
          occupiedUnits: payload.occupiedUnits ?? null,
          listingType: payload.listingType,
          negotiable: payload.negotiable ?? false,
          bedrooms: payload.bedrooms ?? 0,
          floors: payload.floors ?? 1,
          sizeSqm: payload.sizeSqm ?? 0,
          yearBuilt: payload.yearBuilt ?? 0,
          address: payload.address?.trim() ?? '',
          country: payload.country?.trim() ?? 'Brasil',
          zipCode: payload.zipCode?.trim() ?? '',
          mapCoordinate: payload.mapCoordinate?.trim() ?? '',
          typeCode: payload.typeCode?.trim() || null,
          description: normalizePropertyDescription(payload.description),
          highlights: normalizePropertyHighlights(payload.highlights),
          totalActiveLeads: payload.totalActiveLeads ?? activeLeads.length,
          agentId: payload.agentId ?? null,
        },
      });

      if (activeLeads.length > 0) {
        await tx.propertyActiveLead.createMany({
          data: activeLeads.map((lead, index) => ({
            id: randomUUID(),
            propertyId: id,
            leadId: lead.id,
            name: lead.name,
            initials: lead.initials,
            sortOrder: index,
          })),
        });
      }
    });

    const created = await this.findById(payload.storeId, id);
    if (!created) throw new Error('Property create failed');
    return created;
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<PropertyWritePayload, 'storeId'>,
  ): Promise<PropertyEntity | null> {
    const existing = await this.prisma.property.findFirst({
      where: { id, storeId },
    });
    if (!existing) return null;

    const activeLeads = payload.activeLeads;

    await this.prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id },
        data: {
          name: payload.name.trim(),
          city: payload.city?.trim() ?? '',
          state: payload.state?.trim() ?? '',
          type: payload.type,
          units: payload.units ?? 1,
          cost: payload.cost ?? 0,
          views: payload.views ?? existing.views,
          status: propertyStatusToPrisma(payload.status),
          occupiedUnits: payload.occupiedUnits ?? null,
          listingType: payload.listingType,
          negotiable: payload.negotiable ?? false,
          bedrooms: payload.bedrooms ?? 0,
          floors: payload.floors ?? 1,
          sizeSqm: payload.sizeSqm ?? 0,
          yearBuilt: payload.yearBuilt ?? 0,
          address: payload.address?.trim() ?? '',
          country: payload.country?.trim() ?? 'Brasil',
          zipCode: payload.zipCode?.trim() ?? '',
          mapCoordinate: payload.mapCoordinate?.trim() ?? '',
          typeCode: payload.typeCode?.trim() || null,
          description: normalizePropertyDescription(payload.description),
          highlights: normalizePropertyHighlights(payload.highlights),
          totalActiveLeads:
            payload.totalActiveLeads ??
            (activeLeads ? activeLeads.length : existing.totalActiveLeads),
          agentId:
            payload.agentId !== undefined ? payload.agentId : existing.agentId,
        },
      });

      if (activeLeads) {
        await tx.propertyActiveLead.deleteMany({ where: { propertyId: id } });
        if (activeLeads.length > 0) {
          await tx.propertyActiveLead.createMany({
            data: activeLeads.map((lead, index) => ({
              id: randomUUID(),
              propertyId: id,
              leadId: lead.id,
              name: lead.name,
              initials: lead.initials,
              sortOrder: index,
            })),
          });
        }
      }
    });

    return this.findById(storeId, id);
  }

  async updateAvailability(
    storeId: string,
    id: string,
    status: ApiPropertyStatus,
    options?: {
      agentIdIfUnset?: string;
      occupiedUnits?: number | null;
    },
  ): Promise<PropertyEntity | null> {
    const existing = await this.prisma.property.findFirst({
      where: { id, storeId },
      select: { id: true, agentId: true },
    });
    if (!existing) return null;

    const agentIdIfUnset = options?.agentIdIfUnset?.trim();
    await this.prisma.property.update({
      where: { id },
      data: {
        status: propertyStatusToPrisma(status),
        ...(options && 'occupiedUnits' in options
          ? { occupiedUnits: options.occupiedUnits ?? null }
          : {}),
        ...(agentIdIfUnset && !existing.agentId
          ? { agentId: agentIdIfUnset }
          : {}),
      },
    });

    return this.findById(storeId, id);
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const result = await this.prisma.property.deleteMany({
      where: { id, storeId },
    });
    return result.count > 0;
  }

  async syncAgentCatalog(
    storeId: string,
    agentId: string,
    propertyIds: string[],
    fallbackAgentId: string,
  ): Promise<void> {
    const selected = new Set(propertyIds);
    const properties = await this.prisma.property.findMany({
      where: { storeId },
      select: { id: true, agentId: true },
    });

    const ops = properties.flatMap((property) => {
      if (selected.has(property.id)) {
        if (property.agentId === agentId) return [];
        return [
          this.prisma.property.update({
            where: { id: property.id },
            data: { agentId },
          }),
        ];
      }
      if (property.agentId === agentId) {
        return [
          this.prisma.property.update({
            where: { id: property.id },
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

  async reassignOrphanAgentIds(
    storeId: string,
    options: {
      validAgentIds: readonly string[];
      assignToAgentIds: readonly string[];
    },
  ): Promise<number> {
    const valid = [
      ...new Set(options.validAgentIds.map((id) => id.trim()).filter(Boolean)),
    ];
    const assignTo = [
      ...new Set(
        options.assignToAgentIds.map((id) => id.trim()).filter(Boolean),
      ),
    ].sort();
    if (assignTo.length === 0) return 0;

    const orphans = await this.prisma.property.findMany({
      where: {
        storeId,
        OR:
          valid.length > 0
            ? [{ agentId: null }, { agentId: { notIn: valid } }]
            : [{ agentId: null }],
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (orphans.length === 0) return 0;

    await this.prisma.$transaction(
      orphans.map((row, index) =>
        this.prisma.property.update({
          where: { id: row.id },
          data: { agentId: assignTo[index % assignTo.length] },
        }),
      ),
    );
    return orphans.length;
  }

  async rehomePropertiesToAgent(
    storeId: string,
    fromAgentIds: readonly string[],
    toAgentId: string,
  ): Promise<number> {
    const target = toAgentId.trim();
    const from = [
      ...new Set(fromAgentIds.map((id) => id.trim()).filter(Boolean)),
    ].filter((id) => id !== target);
    if (!target || from.length === 0) return 0;

    const result = await this.prisma.property.updateMany({
      where: { storeId, agentId: { in: from } },
      data: { agentId: target },
    });
    return result.count;
  }

  async isCatalogOwnershipHealed(storeId: string): Promise<boolean> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { storeId },
      select: { integrationsJson: true },
    });
    if (!row?.integrationsJson || typeof row.integrationsJson !== 'object') {
      return false;
    }
    return (
      '__catalogOwnershipHealedAt' in
      (row.integrationsJson as Record<string, unknown>)
    );
  }

  async markCatalogOwnershipHealed(storeId: string): Promise<void> {
    const stamp = new Date().toISOString();
    const existing = await this.prisma.storeSettings.findUnique({
      where: { storeId },
      select: { integrationsJson: true },
    });
    const previous =
      existing?.integrationsJson &&
      typeof existing.integrationsJson === 'object' &&
      !Array.isArray(existing.integrationsJson)
        ? (existing.integrationsJson as Record<string, unknown>)
        : {};
    const nextJson = {
      ...previous,
      __catalogOwnershipHealedAt: stamp,
    };

    await this.prisma.storeSettings.upsert({
      where: { storeId },
      create: {
        id: randomUUID(),
        storeId,
        integrationsJson: nextJson,
      },
      update: {
        integrationsJson: nextJson,
      },
    });
  }

  async addPhoto(
    storeId: string,
    propertyId: string,
    photo: { id: string; objectKey: string; mimeType: string },
  ): Promise<PropertyEntity | null> {
    const existing = await this.prisma.property.findFirst({
      where: { id: propertyId, storeId },
      include: { photos: true },
    });
    if (!existing) return null;

    const sortOrder =
      existing.photos.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;

    await this.prisma.propertyPhoto.create({
      data: {
        id: photo.id,
        propertyId,
        url: photo.objectKey,
        mimeType: photo.mimeType,
        sortOrder,
      },
    });

    return this.findById(storeId, propertyId);
  }

  async reorderPhotos(
    storeId: string,
    propertyId: string,
    photoIds: readonly string[],
  ): Promise<PropertyEntity | null> {
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;

    if (photoIds.length > 0) {
      await this.prisma.$transaction(
        photoIds.map((id, index) =>
          this.prisma.propertyPhoto.update({
            where: { id },
            data: { sortOrder: index },
          }),
        ),
      );
    }

    return this.findById(storeId, propertyId);
  }

  async findPhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null> {
    const photo = await this.prisma.propertyPhoto.findFirst({
      where: {
        id: photoId,
        propertyId,
        property: { storeId },
      },
    });
    if (!photo) return null;
    return {
      id: photo.id,
      objectKey: photo.url,
      mimeType: photo.mimeType,
      sortOrder: photo.sortOrder,
    };
  }

  async removePhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null> {
    const photo = await this.findPhoto(storeId, propertyId, photoId);
    if (!photo) return null;
    await this.prisma.propertyPhoto.delete({ where: { id: photoId } });
    return photo;
  }

  async addDocument(
    storeId: string,
    propertyId: string,
    document: {
      id: string;
      name: string;
      sizeLabel: string;
      objectKey: string;
      mimeType: string;
    },
  ): Promise<PropertyEntity | null> {
    const existing = await this.prisma.property.findFirst({
      where: { id: propertyId, storeId },
      select: { id: true },
    });
    if (!existing) return null;

    await this.prisma.propertyDocument.create({
      data: {
        id: document.id,
        propertyId,
        name: document.name,
        sizeLabel: document.sizeLabel,
        objectKey: document.objectKey,
        mimeType: document.mimeType,
      },
    });

    return this.findById(storeId, propertyId);
  }

  async findDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null> {
    const document = await this.prisma.propertyDocument.findFirst({
      where: {
        id: documentId,
        propertyId,
        property: { storeId },
      },
    });
    if (!document) return null;
    return {
      id: document.id,
      name: document.name,
      sizeLabel: document.sizeLabel,
      objectKey: document.objectKey,
      mimeType: document.mimeType,
    };
  }

  async removeDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null> {
    const document = await this.findDocument(storeId, propertyId, documentId);
    if (!document) return null;
    await this.prisma.propertyDocument.delete({ where: { id: documentId } });
    return document;
  }

  private buildWhere(
    storeId: string,
    filters: ListPropertiesFilters,
  ): Prisma.PropertyWhereInput {
    const and: Prisma.PropertyWhereInput[] = [{ storeId }];

    if (filters.status?.length) {
      and.push({
        status: { in: filters.status.map(propertyStatusToPrisma) },
      });
    }
    if (filters.type?.length) {
      and.push({ type: { in: filters.type } });
    }
    if (filters.listingType?.length) {
      and.push({ listingType: { in: filters.listingType } });
    }
    if (filters.negotiable?.length) {
      const wantsYes = filters.negotiable.includes('yes');
      const wantsNo = filters.negotiable.includes('no');
      if (wantsYes && !wantsNo) {
        and.push({ negotiable: true });
      } else if (wantsNo && !wantsYes) {
        and.push({ negotiable: false });
      }
    }
    if (filters.agentId) {
      and.push({ agentId: filters.agentId });
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { typeCode: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { zipCode: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    return { AND: and };
  }

  private toEntity(row: PropertyRow): PropertyEntity {
    return PropertyEntity.create(
      {
        storeId: row.storeId,
        name: row.name,
        city: row.city,
        state: row.state,
        type: row.type,
        units: row.units,
        cost: Number(row.cost),
        views: row.views,
        status: propertyStatusToApi(row.status),
        occupiedUnits: row.occupiedUnits,
        listingType: row.listingType,
        negotiable: row.negotiable,
        bedrooms: row.bedrooms,
        floors: row.floors,
        sizeSqm: row.sizeSqm,
        yearBuilt: row.yearBuilt,
        address: row.address,
        country: row.country,
        zipCode: row.zipCode,
        mapCoordinate: row.mapCoordinate,
        typeCode: row.typeCode,
        description: row.description,
        highlights: row.highlights,
        totalActiveLeads: row.totalActiveLeads,
        agentId: row.agentId,
        photos: [...row.photos]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => ({
            id: p.id,
            objectKey: p.url,
            mimeType: p.mimeType,
            sortOrder: p.sortOrder,
          })),
        documents: row.documents.map((d) => ({
          id: d.id,
          name: d.name,
          sizeLabel: d.sizeLabel,
          objectKey: d.objectKey,
          mimeType: d.mimeType,
        })),
        activeLeads: row.activeLeads.map((l) => ({
          id: l.id,
          leadId: l.leadId,
          name: l.name,
          initials: l.initials,
          sortOrder: l.sortOrder,
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}

import { randomUUID } from 'crypto';
import {
  PropertyEntity,
  type PropertyProps,
} from '../../domain/entities/property.entity';
import {
  PropertyRepository,
  type ListPropertiesFilters,
  type ListPropertiesResult,
  type PropertyDocumentRecord,
  type PropertyPhotoRecord,
  type PropertyWritePayload,
} from '../../domain/repositories/property.repository.interface';
import type { ApiPropertyStatus } from '../../domain/mappers/property-enum.mapper';
import {
  normalizePropertyDescription,
  normalizePropertyHighlights,
} from '../../application/policies/normalize-property-catalog-copy';

function matchesSearch(property: PropertyEntity, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const haystack = [
    property.name,
    property.city,
    property.state,
    property.address,
    property.type,
    property.typeCode ?? '',
    property.description,
    property.highlights.join(' '),
    property.zipCode,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function buildEntityProps(
  payload: Omit<PropertyWritePayload, 'storeId'>,
  storeId: string,
  now: Date,
  existing?: PropertyEntity,
): PropertyProps {
  const activeLeadsInput = payload.activeLeads ?? [];
  const activeLeads =
    activeLeadsInput.length > 0
      ? activeLeadsInput.map((lead, index) => ({
          id: randomUUID(),
          leadId: lead.id,
          name: lead.name,
          initials: lead.initials,
          sortOrder: index,
        }))
      : (existing?.activeLeads ?? []);

  return {
    storeId,
    name: payload.name.trim(),
    city: payload.city?.trim() ?? '',
    state: payload.state?.trim() ?? '',
    type: payload.type,
    units: payload.units ?? existing?.units ?? 1,
    cost: payload.cost ?? existing?.cost ?? 0,
    views: payload.views ?? existing?.views ?? 0,
    status: payload.status,
    occupiedUnits:
      payload.occupiedUnits !== undefined
        ? payload.occupiedUnits
        : (existing?.occupiedUnits ?? null),
    listingType: payload.listingType,
    negotiable: payload.negotiable ?? existing?.negotiable ?? false,
    bedrooms: payload.bedrooms ?? existing?.bedrooms ?? 0,
    floors: payload.floors ?? existing?.floors ?? 1,
    sizeSqm: payload.sizeSqm ?? existing?.sizeSqm ?? 0,
    yearBuilt: payload.yearBuilt ?? existing?.yearBuilt ?? 0,
    address: payload.address?.trim() ?? '',
    country: payload.country?.trim() ?? 'Brasil',
    zipCode: payload.zipCode?.trim() ?? '',
    mapCoordinate: payload.mapCoordinate?.trim() ?? '',
    typeCode: payload.typeCode?.trim() || null,
    description: normalizePropertyDescription(payload.description),
    highlights: normalizePropertyHighlights(payload.highlights),
    totalActiveLeads:
      payload.totalActiveLeads ??
      existing?.totalActiveLeads ??
      activeLeads.length,
    agentId:
      payload.agentId !== undefined
        ? payload.agentId
        : (existing?.agentId ?? null),
    photos: existing ? [...existing.photos] : [],
    documents: existing ? [...existing.documents] : [],
    activeLeads,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryPropertyRepository extends PropertyRepository {
  private readonly items = new Map<string, PropertyEntity>();

  async findMany(
    storeId: string,
    filters: ListPropertiesFilters,
  ): Promise<ListPropertiesResult> {
    await Promise.resolve();
    let rows = [...this.items.values()].filter((p) => p.storeId === storeId);

    if (filters.status?.length) {
      rows = rows.filter((p) => filters.status!.includes(p.status));
    }
    if (filters.type?.length) {
      rows = rows.filter((p) => filters.type!.includes(p.type));
    }
    if (filters.listingType?.length) {
      rows = rows.filter((p) => filters.listingType!.includes(p.listingType));
    }
    if (filters.negotiable?.length) {
      rows = rows.filter((p) => {
        const key = p.negotiable ? 'yes' : 'no';
        return filters.negotiable!.includes(key);
      });
    }
    if (filters.agentId) {
      rows = rows.filter((p) => p.agentId === filters.agentId);
    }
    rows = rows.filter((p) => matchesSearch(p, filters.search));
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = rows.length;
    const start = (filters.page - 1) * filters.perPage;
    return { items: rows.slice(start, start + filters.perPage), total };
  }

  async findById(storeId: string, id: string): Promise<PropertyEntity | null> {
    await Promise.resolve();
    const property = this.items.get(id);
    if (!property || property.storeId !== storeId) return null;
    return property;
  }

  async findByIdGlobal(id: string): Promise<PropertyEntity | null> {
    await Promise.resolve();
    return this.items.get(id) ?? null;
  }

  async create(payload: PropertyWritePayload): Promise<PropertyEntity> {
    await Promise.resolve();
    const id = randomUUID();
    const now = new Date();
    const property = PropertyEntity.create(
      buildEntityProps(payload, payload.storeId, now),
      id,
    );
    this.items.set(id, property);
    return property;
  }

  async update(
    storeId: string,
    id: string,
    payload: Omit<PropertyWritePayload, 'storeId'>,
  ): Promise<PropertyEntity | null> {
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const now = new Date();
    const next = PropertyEntity.create(
      buildEntityProps(payload, storeId, now, existing),
      id,
    );
    this.items.set(id, next);
    return next;
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
    const existing = await this.findById(storeId, id);
    if (!existing) return null;
    const agentIdIfUnset = options?.agentIdIfUnset?.trim();
    const next = existing.with({
      status,
      ...(options && 'occupiedUnits' in options
        ? { occupiedUnits: options.occupiedUnits ?? null }
        : {}),
      agentId:
        agentIdIfUnset && !existing.agentId ? agentIdIfUnset : existing.agentId,
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
    propertyIds: string[],
    fallbackAgentId: string,
  ): Promise<void> {
    await Promise.resolve();
    const selected = new Set(propertyIds);
    for (const property of this.items.values()) {
      if (property.storeId !== storeId) continue;
      if (selected.has(property.id)) {
        if (property.agentId !== agentId) {
          this.items.set(
            property.id,
            property.with({ agentId, updatedAt: new Date() }),
          );
        }
      } else if (property.agentId === agentId) {
        this.items.set(
          property.id,
          property.with({ agentId: fallbackAgentId, updatedAt: new Date() }),
        );
      }
    }
  }

  async reassignOrphanAgentIds(
    storeId: string,
    options: {
      validAgentIds: readonly string[];
      assignToAgentIds: readonly string[];
    },
  ): Promise<number> {
    await Promise.resolve();
    const valid = new Set(
      options.validAgentIds.map((id) => id.trim()).filter(Boolean),
    );
    const assignTo = [
      ...new Set(
        options.assignToAgentIds.map((id) => id.trim()).filter(Boolean),
      ),
    ].sort();
    if (assignTo.length === 0) return 0;

    const orphans = [...this.items.values()]
      .filter(
        (property) =>
          property.storeId === storeId &&
          (!property.agentId || !valid.has(property.agentId)),
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    orphans.forEach((property, index) => {
      this.items.set(
        property.id,
        property.with({
          agentId: assignTo[index % assignTo.length],
          updatedAt: new Date(),
        }),
      );
    });

    return orphans.length;
  }

  private catalogOwnershipHealed = new Set<string>();

  async rehomePropertiesToAgent(
    storeId: string,
    fromAgentIds: readonly string[],
    toAgentId: string,
  ): Promise<number> {
    await Promise.resolve();
    const target = toAgentId.trim();
    const from = new Set(
      fromAgentIds.map((id) => id.trim()).filter((id) => id && id !== target),
    );
    if (!target || from.size === 0) return 0;

    let count = 0;
    for (const property of this.items.values()) {
      if (property.storeId !== storeId) continue;
      if (!property.agentId || !from.has(property.agentId)) continue;
      this.items.set(
        property.id,
        property.with({ agentId: target, updatedAt: new Date() }),
      );
      count += 1;
    }
    return count;
  }

  async isCatalogOwnershipHealed(storeId: string): Promise<boolean> {
    await Promise.resolve();
    return this.catalogOwnershipHealed.has(storeId);
  }

  async markCatalogOwnershipHealed(storeId: string): Promise<void> {
    await Promise.resolve();
    this.catalogOwnershipHealed.add(storeId);
  }

  async addPhoto(
    storeId: string,
    propertyId: string,
    photo: { id: string; objectKey: string; mimeType: string },
  ): Promise<PropertyEntity | null> {
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;
    const sortOrder =
      existing.photos.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
    const next = existing.with({
      photos: [
        ...existing.photos,
        {
          id: photo.id,
          objectKey: photo.objectKey,
          mimeType: photo.mimeType,
          sortOrder,
        },
      ],
      updatedAt: new Date(),
    });
    this.items.set(propertyId, next);
    return next;
  }

  async reorderPhotos(
    storeId: string,
    propertyId: string,
    photoIds: readonly string[],
  ): Promise<PropertyEntity | null> {
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;
    const byId = new Map(existing.photos.map((photo) => [photo.id, photo]));
    const photos = photoIds.map((id, index) => {
      const photo = byId.get(id);
      if (!photo) {
        throw new Error(`photo ${id} not found`);
      }
      return { ...photo, sortOrder: index };
    });
    const next = existing.with({ photos, updatedAt: new Date() });
    this.items.set(propertyId, next);
    return next;
  }

  async findPhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null> {
    const property = await this.findById(storeId, propertyId);
    const photo = property?.photos.find((p) => p.id === photoId);
    return photo ?? null;
  }

  async removePhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null> {
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;
    const photo = existing.photos.find((p) => p.id === photoId);
    if (!photo) return null;
    this.items.set(
      propertyId,
      existing.with({
        photos: existing.photos.filter((p) => p.id !== photoId),
        updatedAt: new Date(),
      }),
    );
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
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;
    const next = existing.with({
      documents: [document, ...existing.documents],
      updatedAt: new Date(),
    });
    this.items.set(propertyId, next);
    return next;
  }

  async findDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null> {
    const property = await this.findById(storeId, propertyId);
    return property?.documents.find((d) => d.id === documentId) ?? null;
  }

  async removeDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null> {
    const existing = await this.findById(storeId, propertyId);
    if (!existing) return null;
    const document = existing.documents.find((d) => d.id === documentId);
    if (!document) return null;
    this.items.set(
      propertyId,
      existing.with({
        documents: existing.documents.filter((d) => d.id !== documentId),
        updatedAt: new Date(),
      }),
    );
    return document;
  }
}

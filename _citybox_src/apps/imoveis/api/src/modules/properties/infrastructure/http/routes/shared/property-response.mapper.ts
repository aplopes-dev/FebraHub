import type { PropertyEntity } from '../../../../domain/entities/property.entity';

/** Shape HTTP de um imóvel (sem envelope `{ data }`). */
export function mapPropertyToHttp(property: PropertyEntity) {
  return {
    id: property.id,
    name: property.name,
    city: property.city,
    state: property.state,
    type: property.type,
    units: property.units,
    cost: property.cost,
    views: property.views,
    status: property.status,
    occupiedUnits: property.occupiedUnits ?? undefined,
    listingType: property.listingType,
    negotiable: property.negotiable,
    bedrooms: property.bedrooms,
    floors: property.floors,
    sizeSqm: property.sizeSqm,
    yearBuilt: property.yearBuilt,
    address: property.address,
    country: property.country,
    zipCode: property.zipCode,
    mapCoordinate: property.mapCoordinate,
    typeCode: property.typeCode ?? undefined,
    description: property.description,
    highlights: property.highlights,
    /** Paths relativos autenticados: `/v1/properties/:id/photos/:photoId`. */
    photoUrls: property.photos.map(
      (photo) => `/v1/properties/${property.id}/photos/${photo.id}`,
    ),
    documents: property.documents.map((d) => ({
      id: d.id,
      name: d.name,
      sizeLabel: d.sizeLabel,
      /** Path relativo autenticado; ausente em documentos legados sem arquivo. */
      path: d.objectKey
        ? `/v1/properties/${property.id}/documents/${d.id}`
        : undefined,
    })),
    activeLeads: property.activeLeads.map((l) => ({
      id: l.leadId,
      name: l.name,
      initials: l.initials,
    })),
    totalActiveLeads: property.totalActiveLeads,
    agentId: property.agentId ?? undefined,
  };
}

export type PropertyHttpDto = ReturnType<typeof mapPropertyToHttp>;

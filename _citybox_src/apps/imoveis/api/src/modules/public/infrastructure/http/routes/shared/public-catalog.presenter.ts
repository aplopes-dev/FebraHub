import type { PropertyEntity } from '../../../../../properties/domain/entities/property.entity';
import { photosInCoverOrder } from './photos-in-cover-order';

function publicPhotoPath(
  storeId: string,
  propertyId: string,
  photoId: string,
): string {
  return `/v1/public/stores/${encodeURIComponent(storeId)}/listings/${encodeURIComponent(propertyId)}/photos/${encodeURIComponent(photoId)}`;
}

function neighborhoodFromAddress(property: PropertyEntity): string {
  return property.address.split(',')[0]?.trim() || property.city;
}

export function mapPublicListingSummary(
  property: PropertyEntity,
  storeId: string,
) {
  const photos = photosInCoverOrder(property.photos);
  const firstPhoto = photos[0];
  return {
    id: property.id,
    title: property.name,
    purpose: property.listingType,
    type: property.type,
    price: property.cost,
    bedrooms: property.bedrooms,
    bathrooms: Math.max(1, property.floors),
    parkingSpots: 1,
    area: property.sizeSqm,
    neighborhood: neighborhoodFromAddress(property),
    city: property.city,
    state: property.state,
    coverPhotoUrl: firstPhoto
      ? publicPhotoPath(storeId, property.id, firstPhoto.id)
      : undefined,
  };
}

export function mapPublicListingDetail(
  property: PropertyEntity,
  storeId: string,
) {
  const summary = mapPublicListingSummary(property, storeId);
  return {
    ...summary,
    /** Corretor dono do imóvel — usado no link curto `/p/:id` para carregar o perfil. */
    agentSlug: property.agentId,
    description: property.description.trim(),
    highlights: property.highlights,
    photoUrls: photosInCoverOrder(property.photos).map((photo) =>
      publicPhotoPath(storeId, property.id, photo.id),
    ),
    mapCoordinate: property.mapCoordinate.trim() || undefined,
  };
}

export function mapPublicAgentToHttp(agent: {
  storeId: string;
  slug: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  region: string;
  creci: string;
  initials: string;
  hasPhoto: boolean;
  whatsappCatalogEnabled: boolean;
  leadFormCatalogEnabled: boolean;
  accentColorId: string;
}) {
  return {
    slug: agent.slug,
    name: agent.name,
    headline: agent.headline,
    phone: agent.phone,
    email: agent.email,
    region: agent.region,
    creci: agent.creci,
    initials: agent.initials,
    whatsappCatalogEnabled: agent.whatsappCatalogEnabled,
    leadFormCatalogEnabled: agent.leadFormCatalogEnabled,
    accentColorId: agent.accentColorId,
    photoUrl: agent.hasPhoto
      ? `/v1/public/stores/${encodeURIComponent(agent.storeId)}/agents/${encodeURIComponent(agent.slug)}/photo`
      : undefined,
  };
}

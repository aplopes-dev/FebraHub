import type { PropertyType } from '@/features/shared/types';
import type { Agent, CatalogListing, ListingPurpose } from '../types';

export type PublicAgentHttp = {
  slug: string;
  name: string;
  headline: string;
  email: string;
  phone: string;
  region: string;
  creci: string;
  initials: string;
  photoUrl?: string;
  whatsappCatalogEnabled?: boolean;
  leadFormCatalogEnabled?: boolean;
  accentColorId?: string;
};

export type PublicListingHttp = {
  id: string;
  title: string;
  purpose: ListingPurpose;
  type: PropertyType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  area: number;
  neighborhood: string;
  city: string;
  state: string;
  description?: string;
  highlights?: readonly string[];
  coverPhotoUrl?: string;
  photoUrls?: readonly string[];
  /** Corretor dono — detalhe sem agentSlug (link curto). */
  agentSlug?: string;
  mapCoordinate?: string;
};

export type CatalogListingsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Quantidade da seção “Imóveis recomendados” na home (página 1 sem filtro). */
export const CATALOG_RECOMMENDED_COUNT = 4;

/** Página do catálogo — alinhado ao módulo Imóveis (`DEFAULT_PER_PAGE` / Listify). */
export const CATALOG_LISTINGS_PER_PAGE = 8;

/** @deprecated Use `CATALOG_LISTINGS_PER_PAGE` — home pagina no mesmo padrão. */
export const CATALOG_HOME_FETCH_COUNT = CATALOG_LISTINGS_PER_PAGE;

/** @deprecated Use `CATALOG_LISTINGS_PER_PAGE` — mantido para imports legados. */
export const CATALOG_HOME_PREVIEW_COUNT = CATALOG_LISTINGS_PER_PAGE;

function photoIdFromApiPath(path: string): string | null {
  const match = path.match(/\/photos\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function toNextPropertyPhotoProxy(
  apiPhotoPath: string,
  propertyId: string,
): string | undefined {
  const photoId = photoIdFromApiPath(apiPhotoPath);
  if (!photoId) return undefined;
  return `/api/public/properties/${encodeURIComponent(propertyId)}/photos/${encodeURIComponent(photoId)}`;
}

export function toNextAgentPhotoProxy(slug: string): string {
  return `/api/public/agents/${encodeURIComponent(slug)}/photo`;
}

export function mapPublicAgentToAgent(agent: PublicAgentHttp): Agent {
  const regionParts = agent.region
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const city = regionParts[0] || agent.region || '—';
  const state = regionParts[1] || '—';

  return {
    slug: agent.slug,
    name: agent.name,
    initials: agent.initials,
    headline: agent.headline,
    bio: '',
    creci: agent.creci,
    phone: agent.phone,
    whatsapp: agent.phone.replace(/\D/g, ''),
    email: agent.email,
    city,
    state,
    photoUrl: agent.photoUrl ? toNextAgentPhotoProxy(agent.slug) : undefined,
    whatsappCatalogEnabled: agent.whatsappCatalogEnabled !== false,
    leadFormCatalogEnabled: agent.leadFormCatalogEnabled !== false,
    accentColorId: agent.accentColorId,
  };
}

export function mapPublicListingToCatalogListing(
  listing: PublicListingHttp,
): CatalogListing {
  const photoUrls = listing.photoUrls
    ?.map((path) => toNextPropertyPhotoProxy(path, listing.id))
    .filter((url): url is string => Boolean(url));

  const coverPhotoUrl = listing.coverPhotoUrl
    ? toNextPropertyPhotoProxy(listing.coverPhotoUrl, listing.id)
    : photoUrls?.[0];

  return {
    id: listing.id,
    title: listing.title,
    purpose: listing.purpose,
    type: listing.type,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    parkingSpots: listing.parkingSpots,
    area: listing.area,
    neighborhood: listing.neighborhood,
    city: listing.city,
    state: listing.state,
    description: listing.description ?? '',
    highlights: listing.highlights ?? [],
    coverPhotoUrl,
    photoUrls: photoUrls?.length ? photoUrls : coverPhotoUrl ? [coverPhotoUrl] : undefined,
    mapCoordinate: listing.mapCoordinate,
  };
}

export function buildPublicListingsQuery(params: {
  page?: number;
  perPage?: number;
  search?: string;
  purpose?: ListingPurpose | 'all';
  type?: PropertyType | 'all';
}): URLSearchParams {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 1));
  q.set('perPage', String(params.perPage ?? CATALOG_LISTINGS_PER_PAGE));

  const search = params.search?.trim();
  if (search) q.set('search', search);

  if (params.purpose && params.purpose !== 'all') {
    q.set('purpose', params.purpose);
  }

  if (params.type && params.type !== 'all') {
    q.set('type', params.type);
  }

  return q;
}

export function publicListingsPath(
  slug: string,
  params: {
    page?: number;
    perPage?: number;
    search?: string;
    purpose?: ListingPurpose | 'all';
    type?: PropertyType | 'all';
  } = {},
): string {
  const q = buildPublicListingsQuery(params);
  return `/v1/public/agents/${encodeURIComponent(slug)}/listings?${q.toString()}`;
}

export function publicAgentPath(slug: string): string {
  return `/v1/public/agents/${encodeURIComponent(slug)}`;
}

/** @deprecated Índice por loja — só sitemap/admin; preferir rotas globais no catálogo. */
export function publicAgentsIndexPath(storeId: string): string {
  return `/v1/public/stores/${encodeURIComponent(storeId)}/agents`;
}

export function publicSubmitLeadPath(slug: string): string {
  return `/v1/public/agents/${encodeURIComponent(slug)}/leads`;
}

export function publicListingDetailPath(
  slug: string,
  listingId: string,
): string {
  const q = new URLSearchParams({ agentSlug: slug });
  return `/v1/public/listings/${encodeURIComponent(listingId)}?${q.toString()}`;
}

/** Detalhe público por id (link curto `/p/:id`) — sem filtrar por corretor. */
export function publicListingByIdPath(listingId: string): string {
  return `/v1/public/listings/${encodeURIComponent(listingId)}`;
}

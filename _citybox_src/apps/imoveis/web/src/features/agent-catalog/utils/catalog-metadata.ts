import type { Metadata } from 'next';
import { getAgentCatalogPath, getPublicPropertyPath } from '@/features/shared/data/navigation';
import { formatCurrency } from '@/features/shared/utils/format';
import { getPublicAppOrigin } from '@/lib/public-app-url';
import type { Agent, CatalogListing } from '../types';

export function absolutePublicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getPublicAppOrigin()}${normalized}`;
}

export function canonicalCatalogUrl(agentSlug: string): string {
  return absolutePublicUrl(getAgentCatalogPath(agentSlug));
}

/** URL canônica para compartilhamento (WhatsApp / OG) — link curto `/p/:id`. */
export function canonicalShortListingUrl(listingId: string): string {
  return absolutePublicUrl(getPublicPropertyPath(listingId));
}

export function canonicalListingUrl(agentSlug: string, listingId: string): string {
  return absolutePublicUrl(
    `${getAgentCatalogPath(agentSlug)}/listings/${encodeURIComponent(listingId)}`,
  );
}

/** Descrição OG: "3 quartos • 2 vagas • R$ 500.000". */
export function buildListingOgDescription(listing: CatalogListing): string {
  const parts: string[] = [];
  if (listing.bedrooms > 0) {
    parts.push(
      listing.bedrooms === 1 ? '1 quarto' : `${listing.bedrooms} quartos`,
    );
  }
  if (listing.bathrooms > 0) {
    parts.push(
      listing.bathrooms === 1 ? '1 banheiro' : `${listing.bathrooms} banheiros`,
    );
  }
  if (listing.parkingSpots > 0) {
    parts.push(
      listing.parkingSpots === 1 ? '1 vaga' : `${listing.parkingSpots} vagas`,
    );
  }
  if (listing.area > 0) {
    parts.push(`${listing.area} m²`);
  }
  parts.push(formatCurrency(listing.price));
  return parts.join(' • ');
}

export function buildAgentCatalogMetadata(agent: Agent): Pick<Metadata, 'openGraph' | 'twitter'> {
  const url = canonicalCatalogUrl(agent.slug);
  const images = agent.photoUrl ? [absolutePublicUrl(agent.photoUrl)] : [];

  return {
    openGraph: {
      title: `${agent.name} - Imóveis`,
      description: agent.headline,
      url,
      type: 'profile',
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: `${agent.name} - Imóveis`,
      description: agent.headline,
      images,
    },
  };
}

export function buildListingCatalogMetadata(
  agent: Agent | null,
  listing: CatalogListing,
  opts?: { canonicalUrl?: string },
): Pick<Metadata, 'openGraph' | 'twitter' | 'description' | 'title'> {
  const url = opts?.canonicalUrl ?? canonicalShortListingUrl(listing.id);
  const images = listing.coverPhotoUrl
    ? [absolutePublicUrl(listing.coverPhotoUrl)]
    : [];
  const ogTitle = agent ? `${listing.title} - ${agent.name}` : listing.title;
  const description = buildListingOgDescription(listing);

  return {
    title: ogTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url,
      type: 'website',
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description,
      images,
    },
  };
}

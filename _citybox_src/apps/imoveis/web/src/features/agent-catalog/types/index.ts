import type { PropertyType } from '@/features/shared/types';

/** Corretor dono da página pública. */
export type Agent = {
  slug: string;
  name: string;
  initials: string;
  headline: string;
  bio: string;
  creci: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  /** Proxy same-origin para foto pública do corretor. */
  photoUrl?: string;
  /** StoreSettings — se false, omite o CTA WhatsApp só na página pública do imóvel. */
  whatsappCatalogEnabled: boolean;
  /** StoreSettings — se false, omite o formulário só na página pública do imóvel. */
  leadFormCatalogEnabled: boolean;
  /** Cor de destaque definida em Configurações do sistema da loja. */
  accentColorId?: string;
};

export type ListingPurpose = 'sale' | 'rent';

export const LISTING_PURPOSE_LABEL: Record<ListingPurpose, string> = {
  sale: 'Venda',
  rent: 'Aluguel',
};

/** Imóvel como o cliente final vê — sem dado interno de gestão. */
export type CatalogListing = {
  id: string;
  title: string;
  purpose: ListingPurpose;
  type: PropertyType;
  price: number;
  /** Condomínio + IPTU mensais, quando houver. */
  monthlyFees?: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  /** Área privativa em m². */
  area: number;
  neighborhood: string;
  city: string;
  state: string;
  description: string;
  highlights: readonly string[];
  isFeatured?: boolean;
  /** Proxy público server-side para foto de capa. */
  coverPhotoUrl?: string;
  /** Galeria completa via proxies Next (detalhe). */
  photoUrls?: readonly string[];
  /** Coordenadas `"lat, lng"` — só no detalhe público. */
  mapCoordinate?: string;
};

export type CatalogListingsMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type AgentCatalog = {
  agent: Agent;
  listings: readonly CatalogListing[];
  listingsMeta?: CatalogListingsMeta;
};

export type CatalogFilter = {
  purpose: ListingPurpose | 'all';
  type: PropertyType | 'all';
};

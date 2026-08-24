import type { PropertyType } from '@/features/shared/types';
import type { CatalogFilter, CatalogListing, ListingPurpose } from '../types';
import {
  CATALOG_LISTINGS_PER_PAGE,
  mapPublicListingToCatalogListing,
  publicListingsPath,
  publicSubmitLeadPath,
  type CatalogListingsMeta,
  type PublicListingHttp,
} from './agent-catalog-mappers';

export class AgentCatalogClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AgentCatalogClientError';
  }
}

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_IMOVEIS_API_URL ?? 'http://127.0.0.1:3112/api'
  ).replace(/\/$/, '');
}

export type ListPublicAgentListingsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  purpose?: CatalogFilter['purpose'];
  type?: CatalogFilter['type'];
};

export type ListPublicAgentListingsResult = {
  listings: CatalogListing[];
  meta: CatalogListingsMeta;
};

export async function listPublicAgentListings(
  slug: string,
  params: ListPublicAgentListingsParams = {},
): Promise<ListPublicAgentListingsResult> {
  const path = publicListingsPath(slug, {
    page: params.page ?? 1,
    perPage: params.perPage ?? CATALOG_LISTINGS_PER_PAGE,
    search: params.search,
    purpose: params.purpose,
    type: params.type,
  });

  const res = await fetch(`${apiBase()}${path}`, { cache: 'no-store' });

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string };
      if (typeof data.message === 'string') message = data.message;
    } catch {
      // ignore
    }
    throw new AgentCatalogClientError(res.status, message);
  }

  const body = (await res.json()) as {
    data: PublicListingHttp[];
    meta: CatalogListingsMeta;
  };

  return {
    listings: body.data.map(mapPublicListingToCatalogListing),
    meta: body.meta,
  };
}

export type SubmitPublicLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  listingId?: string;
};

export async function submitPublicLead(
  slug: string,
  input: SubmitPublicLeadInput,
): Promise<{ id: string; name: string }> {
  const path = publicSubmitLeadPath(slug);
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      listingId: input.listingId,
    }),
  });

  if (!res.ok) {
    let message = `Erro HTTP ${res.status}`;
    try {
      const data = (await res.json()) as {
        message?: string;
        error?: { message?: string } | string;
      };
      if (typeof data.message === 'string') message = data.message;
      else if (typeof data.error === 'object' && data.error?.message) {
        message = data.error.message;
      } else if (typeof data.error === 'string') message = data.error;
    } catch {
      // ignore
    }
    throw new AgentCatalogClientError(res.status, message);
  }

  const body = (await res.json()) as { data: { id: string; name: string } };
  return body.data;
}

export type { ListingPurpose, PropertyType };

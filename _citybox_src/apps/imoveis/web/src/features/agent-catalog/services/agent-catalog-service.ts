import 'server-only';

import {
  ImoveisPublicApiError,
  imoveisPublicFetch,
} from '@/lib/imoveis-public-fetch';
import type { AgentCatalog, CatalogFilter, CatalogListing } from '../types';
import {
  CATALOG_LISTINGS_PER_PAGE,
  mapPublicAgentToAgent,
  mapPublicListingToCatalogListing,
  publicAgentPath,
  publicListingByIdPath,
  publicListingDetailPath,
  publicListingsPath,
  type CatalogListingsMeta,
  type PublicAgentHttp,
  type PublicListingHttp,
} from './agent-catalog-mappers';

export type AgentCatalogPage = AgentCatalog & {
  listingsMeta: CatalogListingsMeta;
};

export async function getPublicAgent(slug: string) {
  const profileRes = await imoveisPublicFetch<{ data: PublicAgentHttp }>(
    publicAgentPath(slug),
  );
  return mapPublicAgentToAgent(profileRes.data);
}

export async function getAgentCatalog(
  slug: string,
): Promise<AgentCatalogPage | undefined> {
  try {
    const [profileRes, propertiesRes] = await Promise.all([
      imoveisPublicFetch<{ data: PublicAgentHttp }>(publicAgentPath(slug)),
      imoveisPublicFetch<{
        data: PublicListingHttp[];
        meta: CatalogListingsMeta;
      }>(
        publicListingsPath(slug, {
          page: 1,
          perPage: CATALOG_LISTINGS_PER_PAGE,
        }),
      ),
    ]);

    return {
      agent: mapPublicAgentToAgent(profileRes.data),
      listings: propertiesRes.data.map(mapPublicListingToCatalogListing),
      listingsMeta: propertiesRes.meta,
    };
  } catch (error) {
    if (error instanceof ImoveisPublicApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

/** Página “Ver todos” — 1ª página da grade completa (estilo módulo Imóveis). */
export async function getAgentCatalogListings(
  slug: string,
  params: {
    search?: string;
    purpose?: CatalogFilter['purpose'];
    type?: CatalogFilter['type'];
  } = {},
): Promise<AgentCatalogPage | undefined> {
  try {
    const [profileRes, propertiesRes] = await Promise.all([
      imoveisPublicFetch<{ data: PublicAgentHttp }>(publicAgentPath(slug)),
      imoveisPublicFetch<{
        data: PublicListingHttp[];
        meta: CatalogListingsMeta;
      }>(
        publicListingsPath(slug, {
          page: 1,
          perPage: CATALOG_LISTINGS_PER_PAGE,
          search: params.search,
          purpose: params.purpose,
          type: params.type,
        }),
      ),
    ]);

    return {
      agent: mapPublicAgentToAgent(profileRes.data),
      listings: propertiesRes.data.map(mapPublicListingToCatalogListing),
      listingsMeta: propertiesRes.meta,
    };
  } catch (error) {
    if (error instanceof ImoveisPublicApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

/** Detalhe enriquecido — busca imóvel completo na API pública quando necessário. */
export async function getCatalogListingDetail(
  slug: string,
  listingId: string,
): Promise<{ catalog: AgentCatalogPage; listing: CatalogListing } | undefined> {
  try {
    const [agent, listingRes] = await Promise.all([
      getPublicAgent(slug),
      imoveisPublicFetch<{ data: PublicListingHttp }>(
        publicListingDetailPath(slug, listingId),
      ),
    ]);

    const listing = mapPublicListingToCatalogListing(listingRes.data);
    const catalog: AgentCatalogPage = {
      agent,
      listings: [listing],
      listingsMeta: {
        total: 1,
        page: 1,
        perPage: CATALOG_LISTINGS_PER_PAGE,
        totalPages: 1,
      },
    };
    return { catalog, listing };
  } catch (error) {
    if (error instanceof ImoveisPublicApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Detalhe público via id global (sem corretor na URL) — link curto `/p/:propertyId`.
 * Carrega o perfil do corretor do imóvel quando `agentSlug` está presente.
 */
export async function getCatalogListingByPropertyId(
  listingId: string,
): Promise<{ catalog: AgentCatalogPage; listing: CatalogListing } | undefined> {
  try {
    const listingRes = await imoveisPublicFetch<{ data: PublicListingHttp }>(
      publicListingByIdPath(listingId),
    );
    const listing = mapPublicListingToCatalogListing(listingRes.data);
    const agentSlug = listingRes.data.agentSlug?.trim();

    let agent: Awaited<ReturnType<typeof getPublicAgent>>;
    if (agentSlug) {
      try {
        agent = await getPublicAgent(agentSlug);
      } catch (error) {
        if (!(error instanceof ImoveisPublicApiError && error.status === 404)) {
          throw error;
        }
        agent = {
          slug: agentSlug,
          name: 'Corretor',
          initials: 'CO',
          headline: '',
          bio: '',
          creci: '',
          phone: '',
          whatsapp: '',
          email: '',
          city: listing.city,
          state: listing.state,
          whatsappCatalogEnabled: true,
          leadFormCatalogEnabled: true,
        };
      }
    } else {
      agent = {
        slug: 'loja',
        name: 'Imobiliária',
        initials: 'IM',
        headline: '',
        bio: '',
        creci: '',
        phone: '',
        whatsapp: '',
        email: '',
        city: listing.city,
        state: listing.state,
        whatsappCatalogEnabled: true,
        leadFormCatalogEnabled: true,
      };
    }

    return {
      catalog: {
        agent,
        listings: [listing],
        listingsMeta: {
          total: 1,
          page: 1,
          perPage: CATALOG_LISTINGS_PER_PAGE,
          totalPages: 1,
        },
      },
      listing,
    };
  } catch (error) {
    if (error instanceof ImoveisPublicApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

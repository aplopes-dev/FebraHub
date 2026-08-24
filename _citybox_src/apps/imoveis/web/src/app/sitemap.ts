import type { MetadataRoute } from 'next';
import { getAgentCatalogPath } from '@/features/shared/data/navigation';
import {
  publicAgentsIndexPath,
  publicListingsPath,
} from '@/features/agent-catalog/services/agent-catalog-mappers';
import { imoveisPublicFetch, publicStoreId } from '@/lib/imoveis-public-fetch';
import { getPublicAppOrigin } from '@/lib/public-app-url';

export const revalidate = 3600;

type PublicAgentIndexHttp = {
  slug: string;
  name: string;
  updatedAt: string | null;
};

type PublicListingIndexHttp = {
  id: string;
};

/**
 * Sitemap usa índice por loja quando `IMOVEIS_STORE_ID` está definido (dev/single-tenant).
 * Em multi-loja o catálogo público já resolve por slug via `/v1/public/agents/:slug`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const storeId = publicStoreId();
  const origin = getPublicAppOrigin();

  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  try {
    const agentsRes = await imoveisPublicFetch<{ data: PublicAgentIndexHttp[] }>(
      publicAgentsIndexPath(storeId),
    );

    for (const agent of agentsRes.data) {
      entries.push({
        url: `${origin}${getAgentCatalogPath(agent.slug)}`,
        lastModified: agent.updatedAt ? new Date(agent.updatedAt) : undefined,
        changeFrequency: 'daily',
        priority: 0.8,
      });
      entries.push({
        url: `${origin}${getAgentCatalogPath(agent.slug)}/listings`,
        changeFrequency: 'daily',
        priority: 0.75,
      });

      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const listingsRes = await imoveisPublicFetch<{
          data: PublicListingIndexHttp[];
          meta: { totalPages: number };
        }>(publicListingsPath(agent.slug, { page, perPage: 100 }));

        totalPages = listingsRes.meta.totalPages;

        for (const listing of listingsRes.data) {
          entries.push({
            url: `${origin}${getAgentCatalogPath(agent.slug)}/listings/${encodeURIComponent(listing.id)}`,
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }

        page += 1;
      }
    }
  } catch {
    // sitemap degrades gracefully when API is offline
  }

  return entries;
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogAllListingsPage } from '@/features/agent-catalog/components/catalog-all-listings-page';
import { getAgentCatalogListings } from '@/features/agent-catalog/services/agent-catalog-service';
import type { CatalogFilter } from '@/features/agent-catalog/types';
import { buildAgentCatalogMetadata } from '@/features/agent-catalog/utils/catalog-metadata';
import type { PropertyType } from '@/features/shared/types';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function parseListingsSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): { filter: CatalogFilter; search: string } {
  const purposeRaw = firstParam(searchParams.purpose);
  const typeRaw = firstParam(searchParams.type);
  const q = firstParam(searchParams.q).trim();

  const purpose: CatalogFilter['purpose'] =
    purposeRaw === 'sale' || purposeRaw === 'rent' ? purposeRaw : 'all';

  const type: CatalogFilter['type'] =
    typeRaw && typeRaw in PROPERTY_TYPE_LABEL ? (typeRaw as PropertyType) : 'all';

  return {
    filter: { purpose, type },
    search: q,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getAgentCatalogListings(slug);

  if (!page) {
    return { title: 'Imóveis não encontrados' };
  }

  const social = buildAgentCatalogMetadata(page.agent);

  return {
    title: `Imóveis disponíveis - ${page.agent.name}`,
    description: page.agent.headline,
    ...social,
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawSearch = await searchParams;
  const { filter, search } = parseListingsSearchParams(rawSearch);

  const pageData = await getAgentCatalogListings(slug, {
    purpose: filter.purpose,
    type: filter.type,
    search: search || undefined,
  });

  if (!pageData) {
    notFound();
  }

  return (
    <CatalogAllListingsPage
      agent={pageData.agent}
      listings={pageData.listings}
      listingsMeta={pageData.listingsMeta}
      initialFilter={filter}
      initialSearch={search}
    />
  );
}

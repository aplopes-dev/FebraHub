import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingDetailPage } from '@/features/agent-catalog/components/listing-detail-page';
import { getCatalogListingDetail } from '@/features/agent-catalog/services/agent-catalog-service';
import { buildListingCatalogMetadata } from '@/features/agent-catalog/utils/catalog-metadata';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string; listingId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, listingId } = await params;
  const result = await getCatalogListingDetail(slug, listingId);

  if (!result) {
    return { title: 'Imóvel não encontrado' };
  }

  return buildListingCatalogMetadata(result.catalog.agent, result.listing);
}

export default async function Page({ params }: PageProps) {
  const { slug, listingId } = await params;
  const result = await getCatalogListingDetail(slug, listingId);

  if (!result) {
    notFound();
  }

  return (
    <ListingDetailPage catalog={result.catalog} listing={result.listing} />
  );
}

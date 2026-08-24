import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingDetailPage } from '@/features/agent-catalog/components/listing-detail-page';
import { getCatalogListingByPropertyId } from '@/features/agent-catalog/services/agent-catalog-service';
import {
  absolutePublicUrl,
  buildListingCatalogMetadata,
  canonicalShortListingUrl,
} from '@/features/agent-catalog/utils/catalog-metadata';
import { getPublicPropertyPath } from '@/features/shared/data/navigation';

/** Search params (`action`) + sessão client — não cachear HTML sem query. */
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ propertyId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { propertyId } = await params;
  const result = await getCatalogListingByPropertyId(propertyId);

  if (!result) {
    return { title: 'Imóvel não encontrado' };
  }

  const social = buildListingCatalogMetadata(result.catalog.agent, result.listing, {
    canonicalUrl: canonicalShortListingUrl(result.listing.id),
  });

  return {
    ...social,
    alternates: {
      canonical: getPublicPropertyPath(result.listing.id),
    },
    metadataBase: new URL(absolutePublicUrl('/')),
  };
}

export default async function Page({ params }: PageProps) {
  const { propertyId } = await params;
  const result = await getCatalogListingByPropertyId(propertyId);

  if (!result) {
    notFound();
  }

  return (
    <ListingDetailPage catalog={result.catalog} listing={result.listing} />
  );
}

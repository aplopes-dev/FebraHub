import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage } from '@/features/agent-catalog/components/catalog-page';
import { getAgentCatalog } from '@/features/agent-catalog/services/agent-catalog-service';
import { buildAgentCatalogMetadata } from '@/features/agent-catalog/utils/catalog-metadata';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getAgentCatalog(slug);

  if (!catalog) {
    return { title: 'Catálogo não encontrado' };
  }

  const social = buildAgentCatalogMetadata(catalog.agent);

  return {
    title: `${catalog.agent.name} - Imóveis`,
    description: catalog.agent.headline,
    ...social,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const catalog = await getAgentCatalog(slug);

  if (!catalog) {
    notFound();
  }

  return <CatalogPage catalog={catalog} />;
}

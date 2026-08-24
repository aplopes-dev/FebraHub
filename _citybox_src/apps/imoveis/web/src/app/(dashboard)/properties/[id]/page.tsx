import type { Metadata } from 'next';
import { PropertyFormLoader } from '@/features/properties/components/property-form-loader';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Editar imóvel — ${id}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PropertyFormLoader id={id} />;
}

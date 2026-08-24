import type { Metadata } from 'next';
import { LeadFormLoader } from '@/features/leads/components/lead-form-loader';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Editar lead — ${id}`,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <LeadFormLoader id={id} />;
}

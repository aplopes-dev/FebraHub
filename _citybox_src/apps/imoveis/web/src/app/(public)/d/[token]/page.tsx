import { PublicDocumentOpenPage } from '@/features/leads/components/public-document-open-page';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  return <PublicDocumentOpenPage token={token} />;
}

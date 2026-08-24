import type { Metadata } from 'next';
import { PublicAnamnesisFillView } from '@/app/public/clinic/anamnese/public-anamnesis-fill-view';

type PublicAnamnesisRouteProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: 'Anamnese',
};

export default async function PublicAnamnesisRoute({ params }: PublicAnamnesisRouteProps) {
  const { token } = await params;
  return <PublicAnamnesisFillView token={token} />;
}

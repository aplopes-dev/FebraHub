import type { Metadata } from 'next';
import { PropertiesPage } from '@/features/properties/components/properties-page';

export const metadata: Metadata = {
  title: 'Imóveis',
};

export default function Page() {
  return <PropertiesPage />;
}

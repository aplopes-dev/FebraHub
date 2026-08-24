import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PropertyFormCreateFromLoader } from '@/features/properties/components/property-form-create-from-loader';

export const metadata: Metadata = {
  title: 'Adicionar imóvel',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="rounded-4xl border border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <PropertyFormCreateFromLoader />
    </Suspense>
  );
}

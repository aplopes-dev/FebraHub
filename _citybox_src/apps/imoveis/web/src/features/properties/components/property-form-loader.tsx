'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePropertyQuery } from '../hooks/use-properties-queries';
import { PropertyFormPage } from './property-form-page';

/** Carrega o imóvel da API antes de montar o form. */
export function PropertyFormLoader({ id }: { id: string }) {
  const router = useRouter();
  const { data: property, isLoading, isError } = usePropertyQuery(id);

  useEffect(() => {
    if (isLoading) return;
    if (isError || property === null) {
      router.replace('/properties');
    }
  }, [isLoading, isError, property, router]);

  if (isLoading || property === undefined) {
    return (
      <div className="rounded-4xl border border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Carregando imóvel…
      </div>
    );
  }

  if (!property) return null;

  return <PropertyFormPage key={property.id} mode="edit" initialProperty={property} />;
}

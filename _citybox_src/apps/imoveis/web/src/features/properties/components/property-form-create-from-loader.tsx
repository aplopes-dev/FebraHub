'use client';

import { useSearchParams } from 'next/navigation';
import { usePropertyQuery } from '../hooks/use-properties-queries';
import { propertyAsCreateTemplate } from '../utils/property-form-helpers';
import { PropertyFormPage } from './property-form-page';

/**
 * Create de imóvel; se `?from=<id>`, pré-preenche metadados (sem fotos/docs).
 */
export function PropertyFormCreateFromLoader() {
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from')?.trim() || undefined;
  const { data: source, isLoading, isError } = usePropertyQuery(
    fromId,
    Boolean(fromId),
  );

  if (!fromId) {
    return <PropertyFormPage mode="create" />;
  }

  if (isLoading || source === undefined) {
    return (
      <div className="rounded-4xl border border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Carregando dados do imóvel…
      </div>
    );
  }

  if (isError || source === null) {
    return <PropertyFormPage mode="create" />;
  }

  return (
    <PropertyFormPage
      key={`from-${source.id}`}
      mode="create"
      initialProperty={propertyAsCreateTemplate(source)}
    />
  );
}

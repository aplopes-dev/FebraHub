'use client';

import { usePathname } from 'next/navigation';
import { ErpPage } from '@/features/shared/components';
import { resolveVerticalNavHit } from '@/lib/vertical/nav-hooks';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';

/** Fallback para rotas listadas no menu sem página dedicada ainda. */
export function ClinicPlaceholderPage() {
  const pathname = usePathname();
  const { manifest } = useVerticalManifest();
  const hit = resolveVerticalNavHit(manifest, pathname);
  const title = hit?.leaf.label ?? manifest?.brand.name ?? 'Clínica';
  const description =
    hit?.leaf.description ?? 'Rota registrada no menu — implemente a página correspondente.';

  return (
    <ErpPage title={title} description={description}>
      <p className="text-sm text-muted-foreground">
        Placeholder — rota: <code className="text-foreground">{pathname}</code>
      </p>
    </ErpPage>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsPage } from '@/features/settings/components/settings-page';

export const metadata: Metadata = {
  title: 'Configurações',
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
      <SettingsPage />
    </Suspense>
  );
}

import type { ReactNode } from 'react';
import { PageHeader } from '@citybox/ui/organisms';

type ErpPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Cabeçalho de página padronizado para telas das verticais. */
export function ErpPage({ title, description, actions, children }: ErpPageProps) {
  return (
    <section className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </section>
  );
}

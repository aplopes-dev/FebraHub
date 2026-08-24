'use client';

import { SearchX } from 'lucide-react';
import { EmptyState } from '@citybox/ui/organisms';

type ReportsEmptyStateProps = {
  className?: string;
  title?: string;
  description?: string;
};

export function ReportsEmptyState({
  className,
  title = 'Sem resultados para o período',
  description = 'Tente alterar os filtros',
}: ReportsEmptyStateProps) {
  return (
    <EmptyState
      icon={<SearchX className="size-16" strokeWidth={1.25} aria-hidden />}
      title={title}
      description={description}
      className={className}
    />
  );
}

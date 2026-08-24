'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@citybox/ui';
import type { PatientFolderBreadcrumb } from '../../../types/patient-file';

type PatientFilesBreadcrumbProps = {
  items: PatientFolderBreadcrumb[];
  onNavigate: (folderId: string | null) => void;
  className?: string;
};

export function PatientFilesBreadcrumb({
  items,
  onNavigate,
  className,
}: PatientFilesBreadcrumbProps) {
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Navegação de pastas"
      className={cn('flex flex-wrap items-center gap-1 text-sm text-muted-foreground', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.id ?? 'root'} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden /> : null}
            {isLast ? (
              <span className="font-medium text-foreground">{item.name}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className="rounded-sm transition-colors hover:text-foreground hover:underline"
              >
                {item.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

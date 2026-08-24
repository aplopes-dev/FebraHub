'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Kanban,
  LayoutGrid,
  Package,
  User,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@citybox/ui/atoms';
import type { GlobalSearchHitType } from '../types';
import type { GlobalSearchResult } from '../types';

const TYPE_ICON: Record<GlobalSearchHitType, ReactNode> = {
  nav: <LayoutGrid className="size-4 shrink-0 opacity-70" aria-hidden />,
  page: <LayoutGrid className="size-4 shrink-0 opacity-70" aria-hidden />,
  patient: <User className="size-4 shrink-0 opacity-70" aria-hidden />,
  opportunity: <Kanban className="size-4 shrink-0 opacity-70" aria-hidden />,
  appointment: <Calendar className="size-4 shrink-0 opacity-70" aria-hidden />,
  stock: <Package className="size-4 shrink-0 opacity-70" aria-hidden />,
};

type ClinicGlobalSearchResultsProps = {
  query: string;
  result: GlobalSearchResult;
  isLoading: boolean;
  onClose: () => void;
};

export function ClinicGlobalSearchResults({
  query,
  result,
  isLoading,
  onClose,
}: ClinicGlobalSearchResultsProps) {
  const router = useRouter();

  const emptyMessage = useMemo(() => {
    if (query.trim().length === 0) {
      return 'Digite para buscar pacientes, oportunidades, agenda, estoque e páginas.';
    }
    if (isLoading) return 'Buscando…';
    return 'Nenhum resultado encontrado.';
  }, [query, isLoading]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Command shouldFilter={false}>
      <CommandList className="max-h-72">
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {result.groups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.hits.map((hit) => (
              <CommandItem
                key={hit.id}
                value={hit.id}
                onSelect={() => handleSelect(hit.href)}
              >
                {TYPE_ICON[hit.type]}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{hit.title}</span>
                  {hit.subtitle ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {hit.subtitle}
                    </span>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

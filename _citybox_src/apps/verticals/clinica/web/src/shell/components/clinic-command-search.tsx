'use client';

import { useEffect, useId, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input, Popover, PopoverAnchor, PopoverContent } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { ClinicGlobalSearchResults } from '@/features/search/components/clinic-global-search-results';
import { useClinicGlobalSearch } from '@/features/search/hooks/use-clinic-global-search';

type ClinicCommandSearchProps = {
  className?: string;
};

export function ClinicCommandSearch({ className }: ClinicCommandSearchProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useClinicGlobalSearch();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        search.setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search.setOpen]);

  const handleClose = () => {
    search.onOpenChange(false);
    inputRef.current?.blur();
  };

  return (
    <Popover open={search.open} onOpenChange={search.onOpenChange}>
      <PopoverAnchor asChild>
        <div className={cn('relative w-full min-w-0', className)}>
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 opacity-60 sm:left-3 sm:size-4"
            aria-hidden
          />
          <Input
            ref={inputRef}
            id={inputId}
            type="search"
            role="searchbox"
            aria-label="Buscar funcionalidades, pacientes e registros"
            aria-expanded={search.open}
            aria-controls="clinic-global-search-results"
            placeholder="Buscar…"
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            onFocus={() => search.setOpen(true)}
            autoComplete="off"
            spellCheck={false}
            className="h-8 border-border bg-background pl-7 text-xs shadow-xs sm:h-9 sm:pl-9 sm:text-sm"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        id="clinic-global-search-results"
        align="center"
        sideOffset={6}
        className="w-[min(calc(100vw-1.5rem),24rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:w-[var(--radix-popover-trigger-width)] sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (inputRef.current?.contains(event.target as Node)) {
            event.preventDefault();
          }
        }}
      >
        <ClinicGlobalSearchResults
          query={search.query}
          result={search.result}
          isLoading={search.isLoading}
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  );
}

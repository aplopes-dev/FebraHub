'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import { BODY_REGIONS, bodyRegionLabel } from '@/lib/body-regions';

const TRIGGER_CLASS =
  'flex h-auto min-h-9 w-full items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1.5 text-left text-sm font-normal outline-none transition-[color,box-shadow,background-color] hover:bg-input/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

const OPTION_CLASS =
  'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted';

type PatientBudgetBodyRegionSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function matchesQuery(label: string, query: string): boolean {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  return label.toLowerCase().includes(normalized);
}

export function PatientBudgetBodyRegionSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecionar região corporal',
  className,
}: PatientBudgetBodyRegionSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const groups = [
      { heading: 'Frente', options: [] as typeof BODY_REGIONS[number][] },
      { heading: 'Costas', options: [] as typeof BODY_REGIONS[number][] },
    ];
    for (const region of BODY_REGIONS) {
      if (!matchesQuery(region.label, query)) continue;
      const group = region.view === 'front' ? groups[0] : groups[1];
      group.options.push(region);
    }
    return groups.filter((group) => group.options.length > 0);
  }, [query]);

  const visible = value.slice(0, 4);
  const overflow = value.length - visible.length;

  const toggle = (regionId: string) => {
    if (value.includes(regionId)) {
      onChange(value.filter((item) => item !== regionId));
      return;
    }
    onChange([...value, regionId]);
  };

  const remove = (regionId: string) => {
    onChange(value.filter((item) => item !== regionId));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(TRIGGER_CLASS, className)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visible.map((regionId) => (
                  <Badge key={regionId} variant="default" className="gap-1 pr-1 font-normal">
                    {bodyRegionLabel(regionId)}
                    <span
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      className="rounded-sm p-0.5 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                      aria-label={`Remover ${bodyRegionLabel(regionId)}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!disabled) remove(regionId);
                      }}
                      onKeyDown={(event) => {
                        if (disabled) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          remove(regionId);
                        }
                      }}
                    >
                      <X className="size-3" aria-hidden />
                    </span>
                  </Badge>
                ))}
                {overflow > 0 ? <Badge variant="default">+{overflow}</Badge> : null}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          'flex w-[var(--radix-popover-trigger-width)] min-w-[16rem] flex-col gap-0 overflow-hidden p-0',
          'max-h-[min(24rem,var(--radix-popover-content-available-height))]',
          CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar região..."
            className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Buscar região corporal"
          />
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
          onWheel={(event) => {
            // Sheet/Dialog (RemoveScroll) bloqueia wheel em conteúdo portaled;
            // a barra funciona, mas o mouse não — aplicar o scroll manualmente.
            event.stopPropagation();
            const node = event.currentTarget;
            if (node.scrollHeight <= node.clientHeight) return;
            node.scrollTop += event.deltaY;
          }}
        >
          {filteredGroups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma região encontrada.
            </p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.heading} className="mb-1.5 last:mb-0">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {group.heading}
                </p>
                {group.options.map((region) => {
                  const isSelected = value.includes(region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      className={cn(OPTION_CLASS, isSelected && 'bg-muted')}
                      onClick={() => toggle(region.id)}
                    >
                      <span className="flex-1">{region.label}</span>
                      <Check
                        className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

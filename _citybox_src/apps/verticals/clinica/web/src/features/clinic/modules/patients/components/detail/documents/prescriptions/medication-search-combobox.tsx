'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import { searchMockMedications } from '../../../../data/mock-medications';

const TRIGGER_CLASS =
  'flex w-full min-h-9 items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-left text-sm transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type MedicationSearchComboboxProps = {
  disabled?: boolean;
  onSelectMedication: (name: string) => void;
};

export function MedicationSearchCombobox({
  disabled = false,
  onSelectMedication,
}: MedicationSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchMockMedications(query), [query]);
  const trimmedQuery = query.trim();
  const canAddCustom = trimmedQuery.length >= 2 && results.length === 0;

  const handleSelect = (name: string) => {
    onSelectMedication(name);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(TRIGGER_CLASS, 'text-muted-foreground')}
          >
            <span className="truncate">Buscar medicamento</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            'w-[var(--radix-popover-trigger-width)] p-0',
            CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite o nome do medicamento…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {results.length > 0 ? (
                <CommandGroup>
                  {results.map((medication) => (
                    <CommandItem
                      key={medication.id}
                      value={medication.name}
                      onSelect={() => handleSelect(medication.name)}
                    >
                      {medication.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {canAddCustom ? (
                <CommandGroup>
                  <CommandItem
                    value={`add-${trimmedQuery}`}
                    onSelect={() => handleSelect(trimmedQuery)}
                  >
                    <Plus className="size-4 shrink-0" aria-hidden />
                    Adicionar &quot;{trimmedQuery}&quot;
                  </CommandItem>
                </CommandGroup>
              ) : null}
              {results.length === 0 && !canAddCustom ? (
                <CommandEmpty>
                  {trimmedQuery.length >= 2
                    ? 'Nenhum medicamento encontrado.'
                    : 'Digite pelo menos 2 caracteres para buscar.'}
                </CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
    </Popover>
  );
}

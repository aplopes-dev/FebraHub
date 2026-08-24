'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import type { BudgetTreatmentOption } from '../../../data/mock-budget-treatments';

const TREATMENT_SELECT_TRIGGER_CLASS =
  'flex w-full min-h-9 items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-left text-sm transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type PatientBudgetTreatmentSelectProps = {
  id?: string;
  value: string;
  treatments: BudgetTreatmentOption[];
  disabled?: boolean;
  placeholder?: string;
  showOptionValue?: boolean;
  onValueChange: (treatmentId: string) => void;
};

function TreatmentOptionContent({
  name,
  valueCents,
  showValue,
  className,
}: {
  name: string;
  valueCents: number;
  showValue: boolean;
  className?: string;
}) {
  return (
    <span className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <span className="truncate font-medium text-foreground">{name}</span>
      {showValue ? (
        <span className="text-xs font-normal text-muted-foreground">
          {formatBrlCurrencyFromCents(valueCents)}
        </span>
      ) : null}
    </span>
  );
}

export function PatientBudgetTreatmentSelect({
  id,
  value,
  treatments,
  disabled = false,
  placeholder = 'Selecionar procedimento',
  showOptionValue = true,
  onValueChange,
}: PatientBudgetTreatmentSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedTreatment = useMemo(
    () => treatments.find((treatment) => treatment.id === value),
    [treatments, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            TREATMENT_SELECT_TRIGGER_CLASS,
            !selectedTreatment && 'text-muted-foreground',
          )}
        >
          {selectedTreatment ? (
            <span className="truncate font-normal text-foreground">{selectedTreatment.name}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
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
        <Command>
          <CommandInput placeholder="Buscar procedimento..." />
          <CommandList>
            <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
            <CommandGroup>
              {treatments.map((treatment) => {
                const isSelected = treatment.id === value;

                return (
                  <CommandItem
                    key={treatment.id}
                    value={treatment.name}
                    data-checked={isSelected}
                    className="items-start py-2.5"
                    onSelect={() => {
                      onValueChange(treatment.id);
                      setOpen(false);
                    }}
                  >
                    <TreatmentOptionContent
                      name={treatment.name}
                      valueCents={treatment.valueCents}
                      showValue={showOptionValue}
                      className="flex-1"
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

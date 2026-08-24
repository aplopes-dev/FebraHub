'use client';

import { ChevronDown, X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import {
  PATIENT_BUDGET_LOWER_LEFT_TEETH,
  PATIENT_BUDGET_LOWER_RIGHT_TEETH,
  PATIENT_BUDGET_UPPER_LEFT_TEETH,
  PATIENT_BUDGET_UPPER_RIGHT_TEETH,
  formatPatientBudgetToothLabel,
  removePatientBudgetToothNumber,
  togglePatientBudgetToothNumber,
} from '../../../lib/patient-budget-tooth-numbers';

type PatientBudgetToothPickerProps = {
  value: number[];
  disabled?: boolean;
  onChange: (toothNumbers: number[]) => void;
};

const TOOTH_PICKER_TRIGGER_CLASS =
  'flex min-h-10 w-full items-start justify-between gap-2 rounded-4xl border border-transparent bg-input/50 px-3 py-2 text-left text-sm outline-none transition-[color,box-shadow,background-color] hover:bg-input/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type ToothButtonProps = {
  toothNumber: number;
  selected: boolean;
  onToggle: (toothNumber: number) => void;
  className?: string;
};

function ToothButton({ toothNumber, selected, onToggle, className }: ToothButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Dente ${toothNumber}`}
      aria-pressed={selected}
      onClick={() => onToggle(toothNumber)}
      className={cn(
        'flex items-center justify-center rounded-md border font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 bg-card text-foreground hover:bg-muted/60',
        className,
      )}
    >
      {formatPatientBudgetToothLabel(toothNumber)}
    </button>
  );
}

function ToothArch({
  rightTeeth,
  leftTeeth,
  selectedTeeth,
  onToggle,
}: {
  rightTeeth: readonly number[];
  leftTeeth: readonly number[];
  selectedTeeth: number[];
  onToggle: (toothNumber: number) => void;
}) {
  const archTeeth = [...rightTeeth, ...leftTeeth];

  return (
    <>
      {/* Mobile: grade 8 colunas (arcada em 2 linhas) — cabe na largura da tela. */}
      <div className="grid w-full grid-cols-8 gap-1 sm:hidden">
        {archTeeth.map((tooth) => (
          <ToothButton
            key={tooth}
            toothNumber={tooth}
            selected={selectedTeeth.includes(tooth)}
            onToggle={onToggle}
            className="aspect-square min-w-0 w-full text-[10px]"
          />
        ))}
      </div>

      {/* sm+: odontograma clássico em uma linha, com intervalo na linha média. */}
      <div className="hidden items-center justify-center gap-6 sm:flex">
        <div className="flex gap-1">
          {rightTeeth.map((tooth) => (
            <ToothButton
              key={tooth}
              toothNumber={tooth}
              selected={selectedTeeth.includes(tooth)}
              onToggle={onToggle}
              className="size-8 text-xs"
            />
          ))}
        </div>
        <div className="flex gap-1">
          {leftTeeth.map((tooth) => (
            <ToothButton
              key={tooth}
              toothNumber={tooth}
              selected={selectedTeeth.includes(tooth)}
              onToggle={onToggle}
              className="size-8 text-xs"
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function PatientBudgetToothPicker({
  value,
  disabled = false,
  onChange,
}: PatientBudgetToothPickerProps) {
  const handleToggle = (toothNumber: number) => {
    onChange(togglePatientBudgetToothNumber(value, toothNumber));
  };

  const handleRemove = (toothNumber: number) => {
    onChange(removePatientBudgetToothNumber(value, toothNumber));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          disabled={disabled}
          className={TOOTH_PICKER_TRIGGER_CLASS}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5 py-0.5">
            {value.length === 0 ? (
              <span className="text-muted-foreground">Selecionar Dente/Região</span>
            ) : (
              value.map((toothNumber) => (
                <Badge
                  key={toothNumber}
                  variant="secondary"
                  className="gap-1 pr-1 font-normal"
                >
                  Dente {formatPatientBudgetToothLabel(toothNumber)}
                  <span
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Remover dente ${toothNumber}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!disabled) handleRemove(toothNumber);
                    }}
                    onKeyDown={(event) => {
                      if (disabled) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        handleRemove(toothNumber);
                      }
                    }}
                  >
                    <X className="size-3" aria-hidden />
                  </span>
                </Badge>
              ))
            )}
          </span>
          <ChevronDown className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-3 sm:w-auto sm:p-4"
      >
        <div className="w-full min-w-0 space-y-3 sm:space-y-4">
          <p className="text-center text-sm font-medium text-foreground">Selecione os dentes</p>
          <ToothArch
            rightTeeth={PATIENT_BUDGET_UPPER_RIGHT_TEETH}
            leftTeeth={PATIENT_BUDGET_UPPER_LEFT_TEETH}
            selectedTeeth={value}
            onToggle={handleToggle}
          />
          <ToothArch
            rightTeeth={PATIENT_BUDGET_LOWER_RIGHT_TEETH}
            leftTeeth={PATIENT_BUDGET_LOWER_LEFT_TEETH}
            selectedTeeth={value}
            onToggle={handleToggle}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

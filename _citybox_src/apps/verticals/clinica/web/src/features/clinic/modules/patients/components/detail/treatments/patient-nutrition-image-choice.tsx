'use client';

import { cn } from '@citybox/ui';
import { RadioGroup, RadioGroupItem } from '@citybox/ui/atoms';

export type NutritionImageChoiceOption = {
  value: string;
  label: string;
  image: string;
};

type PatientNutritionImageChoiceProps = {
  /** Prefixo dos `id` dos rádios; precisa ser único na aba. */
  name: string;
  value: string;
  options: readonly NutritionImageChoiceOption[];
  disabled?: boolean;
  /** Colunas do grid (ex.: `sm:grid-cols-2`). */
  gridClassName?: string;
  imageClassName?: string;
  /** Espaçamento em volta da ilustração. */
  mediaClassName?: string;
  onChange: (value: string) => void;
};

/** Escolha única em cards cinza com ilustração e rótulo no rodapé. */
export function PatientNutritionImageChoice({
  name,
  value,
  options,
  disabled = false,
  gridClassName = 'sm:grid-cols-2',
  imageClassName = 'h-56 w-auto',
  mediaClassName = 'p-4',
  onChange,
}: PatientNutritionImageChoiceProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className={cn('grid gap-4', gridClassName)}
    >
      {options.map((option) => {
        const optionId = `${name}-${option.value}`;
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              'flex cursor-pointer flex-col overflow-hidden rounded-xl border-6 border-transparent bg-muted transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/30',
              isSelected && 'border-primary',
            )}
          >
            <span
              className={cn(
                'flex flex-1 items-center justify-center',
                mediaClassName,
              )}
            >
              {/* Arquivo estático em /public — <img> evita bloqueio do next/image com .svg */}
              <img
                src={option.image}
                alt=""
                aria-hidden
                className={cn('rounded-lg', imageClassName)}
              />
            </span>
            {/* Seleção é indicada pela borda e pelo rodapé; o rádio fica só para teclado/leitor. */}
            <RadioGroupItem
              value={option.value}
              id={optionId}
              disabled={disabled}
              className="sr-only"
            />
            <span
              className={cn(
                'block py-1 text-center text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground',
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}

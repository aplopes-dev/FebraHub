'use client';

import { cn } from '@citybox/ui';
import { Label, RadioGroup, RadioGroupItem } from '@citybox/ui/atoms';
import type { ClinicPlanTreatmentInit } from '../types/clinic-plan-form';

const TREATMENT_INIT_OPTIONS: Array<{
  value: ClinicPlanTreatmentInit;
  title: string;
  description: string;
}> = [
  {
    value: 'copy-default',
    title: 'Copiar procedimentos do plano padrão',
    description:
      'Os procedimentos do plano padrão serão copiados e você poderá editá-los.',
  },
  {
    value: 'empty',
    title: 'Não copiar (plano vazio)',
    description:
      'Começa com as especialidades do sistema (sem procedimentos) para você cadastrar os valores.',
  },
];

type PlanTreatmentInitFieldProps = {
  value: ClinicPlanTreatmentInit | '';
  disabled?: boolean;
  error?: string;
  onChange: (value: ClinicPlanTreatmentInit) => void;
};

export function PlanTreatmentInitField({
  value,
  disabled = false,
  error,
  onChange,
}: PlanTreatmentInitFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">
        Configuração inicial dos procedimentos
      </Label>

      <RadioGroup
        value={value || undefined}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue as ClinicPlanTreatmentInit)}
        className="gap-3"
        aria-invalid={!!error}
      >
        {TREATMENT_INIT_OPTIONS.map((option) => {
          const inputId = `clinic-plan-treatment-init-${option.value}`;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border px-4 py-4 transition-colors',
                disabled && 'cursor-not-allowed opacity-50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 bg-background hover:bg-muted/30',
              )}
            >
              <RadioGroupItem
                id={inputId}
                value={option.value}
                disabled={disabled}
                className="mt-0.5"
                aria-describedby={`${inputId}-description`}
              />
              <div className="space-y-1">
                <span className="text-sm font-medium leading-snug text-foreground">
                  {option.title}
                </span>
                <p
                  id={`${inputId}-description`}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {option.description}
                </p>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

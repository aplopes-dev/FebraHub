'use client';

import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@citybox/ui/atoms';
import { maskDigitsToDecimal } from '../../../lib/nutrition-measure-mask';
import { NUTRITION_GIRTHS } from '../../../lib/nutrition-girths';
import { PatientNutritionMeasureHint } from './patient-nutrition-measure-hint';
import type {
  PatientNutritionCustomGirth,
  PatientNutritionGirthId,
  PatientNutritionGirths,
} from '../../../types/patient-nutrition-body';

const MEASURE_UNIT = 'mm';

type MeasureInputProps = {
  id: string;
  value: string;
  ariaLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Ação à direita; sem ela o espaço é reservado para alinhar as colunas. */
  trailing?: ReactNode;
};

function MeasureInput({
  id,
  value,
  ariaLabel,
  disabled,
  onChange,
  trailing,
}: MeasureInputProps) {
  return (
    <span className="flex items-center gap-2">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        aria-label={ariaLabel}
        className="w-32"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(maskDigitsToDecimal(event.target.value))}
      />
      <span className="text-sm text-muted-foreground">{MEASURE_UNIT}</span>
      {trailing ?? <span className="size-9 shrink-0" aria-hidden />}
    </span>
  );
}

type PatientNutritionGirthsFieldsProps = {
  values: PatientNutritionGirths;
  customValues: readonly PatientNutritionCustomGirth[];
  disabled?: boolean;
  onChange: (id: PatientNutritionGirthId, value: string) => void;
  onCustomChange: (custom: PatientNutritionCustomGirth[]) => void;
};

export function PatientNutritionGirthsFields({
  values,
  customValues,
  disabled = false,
  onChange,
  onCustomChange,
}: PatientNutritionGirthsFieldsProps) {
  const addCustomGirth = () => {
    onCustomChange([
      ...customValues,
      { id: crypto.randomUUID(), label: '', value: '' },
    ]);
  };

  const patchCustomGirth = (
    id: string,
    patch: Partial<PatientNutritionCustomGirth>,
  ) => {
    onCustomChange(
      customValues.map((custom) =>
        custom.id === id ? { ...custom, ...patch } : custom,
      ),
    );
  };

  const leftCustomValues = customValues.filter((_, index) => index % 2 === 1);
  const rightCustomValues = customValues.filter((_, index) => index % 2 === 0);

  const renderCustomGirth = (custom: PatientNutritionCustomGirth) => (
    <div
      key={custom.id}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <Input
        className="w-40"
        placeholder="Nome da medida"
        aria-label="Nome da medida"
        value={custom.label}
        disabled={disabled}
        onChange={(event) =>
          patchCustomGirth(custom.id, { label: event.target.value })
        }
      />
      <MeasureInput
        id={`nutrition-girth-custom-${custom.id}`}
        value={custom.value}
        ariaLabel={`${custom.label || 'Medida'} (${MEASURE_UNIT})`}
        disabled={disabled}
        onChange={(value) => patchCustomGirth(custom.id, { value })}
        trailing={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover medida"
            disabled={disabled}
            onClick={() =>
              onCustomChange(
                customValues.filter((entry) => entry.id !== custom.id),
              )
            }
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        }
      />
    </div>
  );

  const renderCatalogGirth = (girth: (typeof NUTRITION_GIRTHS)[number]) => {
    const fieldId = `nutrition-girth-${girth.id}`;

    return (
      <div
        key={girth.id}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2">
          <Label htmlFor={fieldId} className="font-medium">
            {girth.label}
          </Label>
          <PatientNutritionMeasureHint
            title={girth.tooltipTitle}
            text={girth.tooltipText}
            image={girth.image}
          />
        </span>
        <MeasureInput
          id={fieldId}
          value={values[girth.id]}
          ariaLabel={`${girth.label} (${MEASURE_UNIT})`}
          disabled={disabled}
          onChange={(value) => onChange(girth.id, value)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div className="space-y-3">
          {NUTRITION_GIRTHS.slice(0, 5).map(renderCatalogGirth)}
          {leftCustomValues.map(renderCustomGirth)}
        </div>
        <div className="space-y-3">
          {NUTRITION_GIRTHS.slice(5).map(renderCatalogGirth)}
          {rightCustomValues.map(renderCustomGirth)}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={addCustomGirth}
      >
        <Plus className="size-4" aria-hidden />
        Adicionar medida
      </Button>
    </div>
  );
}

'use client';

import { AlertCircle } from 'lucide-react';
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@citybox/ui/atoms';
import {
  NUTRITION_SKINFOLDS,
  skinfoldMedian,
} from '../../../lib/nutrition-body-composition';
import { maskDecimalInput } from '../../../lib/mask-decimal-input';
import { completeTwoDecimals } from '../../../lib/nutrition-measure-mask';
import { PatientNutritionMeasureHint } from './patient-nutrition-measure-hint';
import type {
  PatientNutritionSkinfoldId,
  PatientNutritionSkinfoldMeasures,
} from '../../../types/patient-nutrition-body';

const MEASURE_FIELDS: ReadonlyArray<{
  key: keyof PatientNutritionSkinfoldMeasures;
  label: string;
}> = [
  { key: 'first', label: '1ª Medida' },
  { key: 'second', label: '2ª Medida' },
  { key: 'third', label: '3ª Medida' },
];

type PatientNutritionSkinfoldsTableProps = {
  values: Record<PatientNutritionSkinfoldId, PatientNutritionSkinfoldMeasures>;
  /** Dobras exigidas pelo protocolo escolhido — vazio quando não há protocolo. */
  requiredIds: readonly PatientNutritionSkinfoldId[];
  /** Exigidas que ainda estão sem medida — recebem destaque de erro. */
  missingIds: readonly PatientNutritionSkinfoldId[];
  disabled?: boolean;
  onChange: (
    id: PatientNutritionSkinfoldId,
    measures: PatientNutritionSkinfoldMeasures,
  ) => void;
};

export function PatientNutritionSkinfoldsTable({
  values,
  requiredIds,
  missingIds,
  disabled = false,
  onChange,
}: PatientNutritionSkinfoldsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[12rem]">Dobra</TableHead>
            {MEASURE_FIELDS.map((field) => (
              <TableHead key={field.key} className="w-32">
                {field.label}
              </TableHead>
            ))}
            <TableHead className="w-24">Mediana</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {NUTRITION_SKINFOLDS.map((skinfold) => {
            const measures = values[skinfold.id];
            const median = skinfoldMedian(measures);
            const isRequired = requiredIds.includes(skinfold.id);
            const isMissing = missingIds.includes(skinfold.id);

            return (
              <TableRow key={skinfold.id}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{skinfold.label}</span>
                    <PatientNutritionMeasureHint
                      title={skinfold.tooltipTitle}
                      text={skinfold.tooltipText}
                      image={skinfold.image}
                    />
                    {isRequired ? (
                      <AlertCircle
                        className="size-4 text-destructive"
                        aria-label="Obrigatório para o protocolo de Petróski"
                      />
                    ) : null}
                  </span>
                </TableCell>
                {MEASURE_FIELDS.map((field) => (
                  <TableCell key={field.key}>
                    <Input
                      value={measures[field.key]}
                      inputMode="decimal"
                      placeholder="mm"
                      aria-label={`${skinfold.label} — ${field.label}`}
                      aria-invalid={isMissing}
                      disabled={disabled}
                      onChange={(event) =>
                        onChange(skinfold.id, {
                          ...measures,
                          [field.key]: maskDecimalInput(event.target.value),
                        })
                      }
                      onBlur={() =>
                        onChange(skinfold.id, {
                          ...measures,
                          [field.key]: completeTwoDecimals(measures[field.key]),
                        })
                      }
                    />
                  </TableCell>
                ))}
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {median != null
                    ? `${median.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} mm`
                    : '0,00 mm'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

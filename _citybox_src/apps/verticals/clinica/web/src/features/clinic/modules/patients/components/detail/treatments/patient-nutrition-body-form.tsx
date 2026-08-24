'use client';

import { useMemo, type ReactNode } from 'react';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@citybox/ui/atoms';
import {
  calculatePatientBmi,
  formatPatientBmi,
  patientGenderToImcSilhouetteSex,
  patientImcSilhouetteSrc,
  resolvePatientImcStage,
} from '@/lib/patient-imc';
import {
  NUTRITION_ADIPOMETRY_PROTOCOLS,
  NUTRITION_CELLULITE_GRADES,
  NUTRITION_FAT_DISTRIBUTION_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_TYPES,
  NUTRITION_STRETCH_MARKS,
  hasNutritionBmiFilled,
  missingPetroskiSkinfolds,
  parseDecimalInput,
  petroskiRequiredSkinfolds,
} from '../../../lib/nutrition-body-composition';
import {
  ageYearsFromBirthDate,
  calculatePetroskiComposition,
} from '../../../lib/nutrition-petroski';
import {
  completeDecimalZeros,
  maskDecimalInput,
} from '../../../lib/mask-decimal-input';
import { PatientNutritionGirthsFields } from './patient-nutrition-girths-fields';
import { PatientNutritionAppearancePicker } from './patient-nutrition-appearance-picker';
import { PatientNutritionImageChoice } from './patient-nutrition-image-choice';
import { PatientNutritionPetroskiCharts } from './patient-nutrition-petroski-charts';
import { PatientNutritionSkinfoldsTable } from './patient-nutrition-skinfolds-table';
import type { PatientGender } from '../../../types/patient-form';
import type {
  PatientNutritionAdipometryProtocol,
  PatientNutritionBody,
  PatientNutritionCelluliteGrade,
  PatientNutritionFatDistribution,
  PatientNutritionRectusDiastasisResult,
  PatientNutritionRectusDiastasisType,
  PatientNutritionStretchMarkType,
} from '../../../types/patient-nutrition-body';

const NO_PROTOCOL_VALUE = 'none';

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type PatientNutritionBodyFormProps = {
  value: PatientNutritionBody;
  gender?: PatientGender | null;
  /** Data de nascimento (yyyy-MM-dd) — idade no cálculo de Petróski. */
  patientBirthDate?: string | null;
  disabled?: boolean;
  onChange: (next: PatientNutritionBody) => void;
};

export function PatientNutritionBodyForm({
  value,
  gender,
  patientBirthDate,
  disabled = false,
  onChange,
}: PatientNutritionBodyFormProps) {
  const bmi = useMemo(() => {
    const weightKg = parseDecimalInput(value.weightKg);
    const heightCm = parseDecimalInput(value.heightCm);
    if (weightKg == null || heightCm == null) return null;
    return calculatePatientBmi(weightKg, heightCm);
  }, [value.heightCm, value.weightKg]);

  const stage = bmi != null ? resolvePatientImcStage(bmi) : null;
  const silhouetteSex = patientGenderToImcSilhouetteSex(gender ?? 'other');

  const ageYears = useMemo(
    () => ageYearsFromBirthDate(patientBirthDate),
    [patientBirthDate],
  );

  const isPetroski = value.adipometryProtocol === 'petroski';
  const requiredIds = isPetroski ? petroskiRequiredSkinfolds(gender) : [];
  const missingIds = isPetroski ? missingPetroskiSkinfolds(value, gender) : [];
  const isBmiMissing = isPetroski && !hasNutritionBmiFilled(value);
  const isAgeMissing = isPetroski && ageYears == null;

  const petroskiComposition = useMemo(
    () =>
      calculatePetroskiComposition({
        body: value,
        gender,
        ageYears,
      }),
    [ageYears, gender, value],
  );

  return (
    <div className="space-y-8">
      <Section title="Distribuição de gordura corporal">
        <PatientNutritionImageChoice
          name="nutrition-fat-distribution"
          value={value.fatDistribution}
          options={NUTRITION_FAT_DISTRIBUTION_OPTIONS}
          disabled={disabled}
          onChange={(next) =>
            onChange({
              ...value,
              fatDistribution: next as PatientNutritionFatDistribution,
            })
          }
        />
      </Section>

      <Separator />

      <Section title="Cálculo de IMC">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nutrition-body-weight">Peso (kg)</Label>
            <Input
              id="nutrition-body-weight"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={value.weightKg}
              aria-invalid={isBmiMissing}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  weightKg: maskDecimalInput(event.target.value),
                })
              }
              onBlur={() =>
                onChange({
                  ...value,
                  weightKg: completeDecimalZeros(value.weightKg),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nutrition-body-height">Altura (cm)</Label>
            <Input
              id="nutrition-body-height"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={value.heightCm}
              aria-invalid={isBmiMissing}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  heightCm: maskDecimalInput(event.target.value),
                })
              }
              onBlur={() =>
                onChange({
                  ...value,
                  heightCm: completeDecimalZeros(value.heightCm),
                })
              }
            />
          </div>
        </div>

        {bmi != null && stage ? (
          <div className="flex items-center gap-6 rounded-xl border border-border/60 p-4">
            <img
              src={patientImcSilhouetteSrc(
                stage.silhouetteVariant,
                silhouetteSex,
              )}
              alt=""
              aria-hidden
              className="h-56 w-auto"
            />
            <dl className="grid flex-1 gap-3 sm:grid-cols-3">
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">IMC</dt>
                <dd className="text-lg font-semibold text-foreground tabular-nums">
                  {formatPatientBmi(bmi)} Kg/m²
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">
                  Tipo de obesidade
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {stage.obesityTypeLabel}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">Grau de risco</dt>
                <dd className="text-sm font-medium text-foreground">
                  {stage.riskGradeLabel}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Section>

      <Separator />

      <Section
        title="Adipometria"
        description="Utilize o Protocolo de Petróski para calcular o percentual de gordura."
      >
        <div className="space-y-1.5 sm:max-w-xs">
          <Label htmlFor="nutrition-adipometry-protocol">Protocolo</Label>
          <Select
            value={value.adipometryProtocol || NO_PROTOCOL_VALUE}
            onValueChange={(next) =>
              onChange({
                ...value,
                adipometryProtocol:
                  next === NO_PROTOCOL_VALUE
                    ? ''
                    : (next as PatientNutritionAdipometryProtocol),
              })
            }
            disabled={disabled}
          >
            <SelectTrigger
              id="nutrition-adipometry-protocol"
              className="w-full"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROTOCOL_VALUE}>Selecione</SelectItem>
              {NUTRITION_ADIPOMETRY_PROTOCOLS.map((protocol) => (
                <SelectItem key={protocol.value} value={protocol.value}>
                  {protocol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {missingIds.length > 0 ? (
          <p className="text-sm text-destructive" role="alert">
            Informe ao menos 2 medidas em cada dobra obrigatória do protocolo de
            Petróski.
          </p>
        ) : null}

        {isBmiMissing ? (
          <p className="text-sm text-destructive" role="alert">
            É necessário ter um campo de IMC preenchido nesse atendimento para
            poder usar o protocolo de Petróski.
          </p>
        ) : null}

        {isAgeMissing ? (
          <p className="text-sm text-destructive" role="alert">
            Informe a data de nascimento do paciente para calcular o protocolo
            de Petróski.
          </p>
        ) : null}

        <PatientNutritionSkinfoldsTable
          values={value.skinfolds}
          requiredIds={requiredIds}
          missingIds={missingIds}
          disabled={disabled}
          onChange={(id, measures) =>
            onChange({
              ...value,
              skinfolds: { ...value.skinfolds, [id]: measures },
            })
          }
        />

        {petroskiComposition ? (
          <PatientNutritionPetroskiCharts composition={petroskiComposition} />
        ) : null}
      </Section>

      <Separator />

      <Section title="Perimetria">
        <PatientNutritionGirthsFields
          values={value.girths}
          customValues={value.customGirths}
          disabled={disabled}
          onChange={(id, girthValue) =>
            onChange({
              ...value,
              girths: { ...value.girths, [id]: girthValue },
            })
          }
          onCustomChange={(customGirths) =>
            onChange({ ...value, customGirths })
          }
        />
      </Section>

      <Separator />

      <Section title="Grau de celulite">
        <PatientNutritionImageChoice
          name="nutrition-cellulite-grade"
          value={value.celluliteGrade}
          options={NUTRITION_CELLULITE_GRADES}
          disabled={disabled}
          gridClassName="sm:grid-cols-2 lg:grid-cols-4"
          imageClassName="h-56 w-full object-cover"
          onChange={(next) =>
            onChange({
              ...value,
              celluliteGrade: next as PatientNutritionCelluliteGrade,
            })
          }
        />
      </Section>

      <Separator />

      <Section title="Estrias">
        <PatientNutritionImageChoice
          name="nutrition-stretch-marks"
          value={value.stretchMarks}
          options={NUTRITION_STRETCH_MARKS}
          disabled={disabled}
          gridClassName="max-w-2xl sm:grid-cols-2"
          imageClassName="h-72 w-auto object-contain"
          onChange={(next) =>
            onChange({
              ...value,
              stretchMarks: next as PatientNutritionStretchMarkType,
            })
          }
        />
      </Section>

      <Separator />

      <Section title="Observações">
        <Textarea
          id="nutrition-body-notes"
          rows={6}
          placeholder="Observações adicionais…"
          aria-label="Observações"
          value={value.notes}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, notes: event.target.value })
          }
        />
      </Section>

      <Separator />

      <Section title="Teste de diástase de reto abdominal">
        <PatientNutritionImageChoice
          name="nutrition-rectus-diastasis"
          value={value.rectusDiastasis}
          options={NUTRITION_RECTUS_DIASTASIS_OPTIONS}
          disabled={disabled}
          gridClassName="max-w-2xl sm:grid-cols-2"
          onChange={(next) =>
            onChange({
              ...value,
              rectusDiastasis: next as PatientNutritionRectusDiastasisResult,
            })
          }
        />
      </Section>

      <Separator />

      <Section title="Tipo de diástase de reto abdominal">
        <PatientNutritionImageChoice
          name="nutrition-rectus-diastasis-type"
          value={value.rectusDiastasisType}
          options={NUTRITION_RECTUS_DIASTASIS_TYPES}
          disabled={disabled}
          gridClassName="grid-cols-4"
          imageClassName="h-auto w-full"
          mediaClassName="p-2"
          onChange={(next) =>
            onChange({
              ...value,
              rectusDiastasisType: next as PatientNutritionRectusDiastasisType,
            })
          }
        />
      </Section>

      <Separator />

      <Section title="Observações">
        <Textarea
          id="nutrition-rectus-diastasis-notes"
          rows={6}
          placeholder="Observações sobre a diástase…"
          aria-label="Observações da diástase"
          value={value.rectusDiastasisNotes}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, rectusDiastasisNotes: event.target.value })
          }
        />
      </Section>

      <Separator />

      <Section title="Aparência percebida">
        <PatientNutritionAppearancePicker
          label="Aparência percebida"
          value={value.perceivedAppearance}
          sex={silhouetteSex}
          disabled={disabled}
          onChange={(perceivedAppearance) =>
            onChange({ ...value, perceivedAppearance })
          }
        />
      </Section>

      <Separator />

      <Section title="Aparência desejada">
        <PatientNutritionAppearancePicker
          label="Aparência desejada"
          value={value.desiredAppearance}
          sex={silhouetteSex}
          disabled={disabled}
          onChange={(desiredAppearance) =>
            onChange({ ...value, desiredAppearance })
          }
        />
      </Section>
    </div>
  );
}

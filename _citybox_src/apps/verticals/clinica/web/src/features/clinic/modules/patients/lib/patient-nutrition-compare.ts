import {
  calculatePatientBmi,
  formatPatientBmi,
  type PatientImcSilhouetteSex,
} from '@/lib/patient-imc';
import { nutritionAppearanceSilhouetteSrc } from './nutrition-appearance';
import {
  NUTRITION_ADIPOMETRY_PROTOCOLS,
  NUTRITION_CELLULITE_GRADES,
  NUTRITION_FAT_DISTRIBUTION_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_OPTIONS,
  NUTRITION_RECTUS_DIASTASIS_TYPES,
  NUTRITION_SKINFOLDS,
  NUTRITION_STRETCH_MARKS,
  parseDecimalInput,
  skinfoldMedian,
} from './nutrition-body-composition';
import { NUTRITION_GIRTHS } from './nutrition-girths';
import type { PatientNutritionBody } from '../types/patient-nutrition-body';

/**
 * Comparação de dois atendimentos nutricionais. As linhas são montadas a partir
 * dos dois lados de uma vez para que a mesma métrica caia na mesma altura da
 * tela — inclusive as medidas livres de perimetria, que só existem em um lado.
 */
export type NutritionCompareCell =
  | { kind: 'text'; text: string }
  | { kind: 'measure'; text: string; value: number }
  | { kind: 'image'; text: string; image: string };

export type NutritionCompareRow = {
  id: string;
  label: string;
  left: NutritionCompareCell | null;
  right: NutritionCompareCell | null;
  /** Direita menos esquerda, só quando as duas células são numéricas. */
  delta: number | null;
};

export type NutritionCompareGroup = {
  id: string;
  title: string;
  rows: NutritionCompareRow[];
};

type OptionCatalog = readonly { value: string; label: string; image: string }[];

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** `+1,20` / `-0,50` — a unidade fica na própria célula. */
export function formatNutritionCompareDelta(delta: number): string {
  const signal = delta > 0 ? '+' : '-';
  return `${signal}${formatNumber(Math.abs(delta))}`;
}

function measureCell(
  raw: string | undefined,
  unit: string,
): NutritionCompareCell | null {
  const value = parseDecimalInput(raw ?? '');
  if (value == null) return null;

  return { kind: 'measure', text: `${formatNumber(value)} ${unit}`, value };
}

function numberCell(
  value: number | null,
  text: string,
): NutritionCompareCell | null {
  if (value == null) return null;

  return { kind: 'measure', text, value };
}

function imageCell(
  catalog: OptionCatalog,
  value: string,
): NutritionCompareCell | null {
  const option = catalog.find((item) => item.value === value);
  if (!option) return null;

  return { kind: 'image', text: option.label, image: option.image };
}

function textCell(text: string): NutritionCompareCell | null {
  return text.trim() ? { kind: 'text', text } : null;
}

function appearanceCell(
  body: PatientNutritionBody | null,
  field: 'perceivedAppearance' | 'desiredAppearance',
  sex: PatientImcSilhouetteSex,
): NutritionCompareCell | null {
  const level = body?.[field];
  if (!level) return null;

  return {
    kind: 'image',
    text: `Nível ${level}`,
    image: nutritionAppearanceSilhouetteSrc(level, sex),
  };
}

function bmiCell(body: PatientNutritionBody | null): NutritionCompareCell | null {
  if (!body) return null;

  const weightKg = parseDecimalInput(body.weightKg);
  const heightCm = parseDecimalInput(body.heightCm);
  if (weightKg == null || heightCm == null) return null;

  const bmi = calculatePatientBmi(weightKg, heightCm);
  if (bmi == null) return null;

  return numberCell(bmi, `${formatPatientBmi(bmi)} Kg/m²`);
}

function buildRow(
  id: string,
  label: string,
  left: NutritionCompareCell | null,
  right: NutritionCompareCell | null,
): NutritionCompareRow | null {
  if (!left && !right) return null;

  const delta =
    left?.kind === 'measure' && right?.kind === 'measure'
      ? Math.round((right.value - left.value) * 100) / 100
      : null;

  return { id, label, left, right, delta };
}

function buildGroup(
  id: string,
  title: string,
  rows: readonly (NutritionCompareRow | null)[],
): NutritionCompareGroup | null {
  const filled = rows.filter((row): row is NutritionCompareRow => row !== null);
  return filled.length > 0 ? { id, title, rows: filled } : null;
}

/** Medidas livres: a união dos rótulos dos dois atendimentos, sem duplicar. */
function customGirthLabels(
  left: PatientNutritionBody | null,
  right: PatientNutritionBody | null,
): string[] {
  const labels = [...(left?.customGirths ?? []), ...(right?.customGirths ?? [])]
    .map((girth) => girth.label.trim())
    .filter(Boolean);

  return Array.from(new Set(labels));
}

function customGirthCell(
  body: PatientNutritionBody | null,
  label: string,
): NutritionCompareCell | null {
  const girth = body?.customGirths.find(
    (item) => item.label.trim().toLowerCase() === label.toLowerCase(),
  );

  return measureCell(girth?.value, 'mm');
}

export function buildNutritionComparison(
  left: PatientNutritionBody | null,
  right: PatientNutritionBody | null,
  sex: PatientImcSilhouetteSex,
): NutritionCompareGroup[] {
  const protocolLabel = (body: PatientNutritionBody | null) =>
    NUTRITION_ADIPOMETRY_PROTOCOLS.find(
      (protocol) => protocol.value === body?.adipometryProtocol,
    )?.label ?? '';

  const groups = [
    buildGroup('body', 'Composição corporal', [
      buildRow(
        'weight',
        'Peso',
        measureCell(left?.weightKg, 'kg'),
        measureCell(right?.weightKg, 'kg'),
      ),
      buildRow(
        'height',
        'Altura',
        measureCell(left?.heightCm, 'cm'),
        measureCell(right?.heightCm, 'cm'),
      ),
      buildRow('bmi', 'IMC', bmiCell(left), bmiCell(right)),
      buildRow(
        'fat-distribution',
        'Distribuição de gordura corporal',
        imageCell(NUTRITION_FAT_DISTRIBUTION_OPTIONS, left?.fatDistribution ?? ''),
        imageCell(
          NUTRITION_FAT_DISTRIBUTION_OPTIONS,
          right?.fatDistribution ?? '',
        ),
      ),
    ]),
    buildGroup('skinfolds', 'Adipometria (mediana das dobras)', [
      buildRow(
        'protocol',
        'Protocolo',
        textCell(protocolLabel(left)),
        textCell(protocolLabel(right)),
      ),
      ...NUTRITION_SKINFOLDS.map((skinfold) => {
        const median = (body: PatientNutritionBody | null) => {
          const measures = body?.skinfolds[skinfold.id];
          const value = measures ? skinfoldMedian(measures) : null;
          return numberCell(value, value == null ? '' : `${formatNumber(value)} mm`);
        };

        return buildRow(
          `skinfold-${skinfold.id}`,
          skinfold.label,
          median(left),
          median(right),
        );
      }),
    ]),
    buildGroup('girths', 'Perimetria', [
      ...NUTRITION_GIRTHS.map((girth) =>
        buildRow(
          `girth-${girth.id}`,
          girth.label,
          measureCell(left?.girths[girth.id], 'mm'),
          measureCell(right?.girths[girth.id], 'mm'),
        ),
      ),
      ...customGirthLabels(left, right).map((label) =>
        buildRow(
          `girth-custom-${label.toLowerCase()}`,
          label,
          customGirthCell(left, label),
          customGirthCell(right, label),
        ),
      ),
    ]),
    buildGroup('skin', 'Pele', [
      buildRow(
        'cellulite',
        'Grau de celulite',
        imageCell(NUTRITION_CELLULITE_GRADES, left?.celluliteGrade ?? ''),
        imageCell(NUTRITION_CELLULITE_GRADES, right?.celluliteGrade ?? ''),
      ),
      buildRow(
        'stretch-marks',
        'Estrias',
        imageCell(NUTRITION_STRETCH_MARKS, left?.stretchMarks ?? ''),
        imageCell(NUTRITION_STRETCH_MARKS, right?.stretchMarks ?? ''),
      ),
      buildRow(
        'body-notes',
        'Observações',
        textCell(left?.notes ?? ''),
        textCell(right?.notes ?? ''),
      ),
    ]),
    buildGroup('diastasis', 'Diástase de reto abdominal', [
      buildRow(
        'diastasis-result',
        'Teste',
        imageCell(NUTRITION_RECTUS_DIASTASIS_OPTIONS, left?.rectusDiastasis ?? ''),
        imageCell(
          NUTRITION_RECTUS_DIASTASIS_OPTIONS,
          right?.rectusDiastasis ?? '',
        ),
      ),
      buildRow(
        'diastasis-type',
        'Tipo',
        imageCell(
          NUTRITION_RECTUS_DIASTASIS_TYPES,
          left?.rectusDiastasisType ?? '',
        ),
        imageCell(
          NUTRITION_RECTUS_DIASTASIS_TYPES,
          right?.rectusDiastasisType ?? '',
        ),
      ),
      buildRow(
        'diastasis-notes',
        'Observações',
        textCell(left?.rectusDiastasisNotes ?? ''),
        textCell(right?.rectusDiastasisNotes ?? ''),
      ),
    ]),
    buildGroup('appearance', 'Aparência', [
      buildRow(
        'perceived',
        'Aparência percebida',
        appearanceCell(left, 'perceivedAppearance', sex),
        appearanceCell(right, 'perceivedAppearance', sex),
      ),
      buildRow(
        'desired',
        'Aparência desejada',
        appearanceCell(left, 'desiredAppearance', sex),
        appearanceCell(right, 'desiredAppearance', sex),
      ),
    ]),
  ];

  return groups.filter((group): group is NutritionCompareGroup => group !== null);
}

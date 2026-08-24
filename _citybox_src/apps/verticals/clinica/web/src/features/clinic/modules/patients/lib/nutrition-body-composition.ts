import {
  createEmptyNutritionGirths,
  parseNutritionCustomGirths,
  parseNutritionGirths,
} from './nutrition-girths';
import { parseNutritionAppearance } from './nutrition-appearance';
import type { PatientGender } from '../types/patient-form';
import type {
  PatientNutritionAdipometryProtocol,
  PatientNutritionBody,
  PatientNutritionCelluliteGrade,
  PatientNutritionFatDistribution,
  PatientNutritionRectusDiastasisResult,
  PatientNutritionRectusDiastasisType,
  PatientNutritionStretchMarkType,
  PatientNutritionSkinfoldId,
  PatientNutritionSkinfoldMeasures,
} from '../types/patient-nutrition-body';

/**
 * Catálogos da aba "Corporal" da nutrição. Os `id` são persistidos no JSON da
 * inicialização — alterá-los descarta medições já gravadas.
 */
export type NutritionFatDistributionOption = {
  value: Exclude<PatientNutritionFatDistribution, ''>;
  label: string;
  image: string;
};

export const NUTRITION_FAT_DISTRIBUTION_OPTIONS: readonly NutritionFatDistributionOption[] =
  [
    {
      value: 'ginoide',
      label: 'Ginoide',
      image: '/clinic/nutricao/ginoide.svg',
    },
    {
      value: 'androide',
      label: 'Androide',
      image: '/clinic/nutricao/androide.svg',
    },
  ];

export type NutritionCelluliteGradeOption = {
  value: Exclude<PatientNutritionCelluliteGrade, ''>;
  label: string;
  image: string;
};

export const NUTRITION_CELLULITE_GRADES: readonly NutritionCelluliteGradeOption[] =
  [
    {
      value: 'grau_1',
      label: 'Grau 01',
      image: '/clinic/nutricao/celulite/grau-1.jpg',
    },
    {
      value: 'grau_2',
      label: 'Grau 02',
      image: '/clinic/nutricao/celulite/grau-2.jpg',
    },
    {
      value: 'grau_3',
      label: 'Grau 03',
      image: '/clinic/nutricao/celulite/grau-3.jpg',
    },
    {
      value: 'grau_4',
      label: 'Grau 04',
      image: '/clinic/nutricao/celulite/grau-4.jpg',
    },
  ];

export type NutritionStretchMarkOption = {
  value: Exclude<PatientNutritionStretchMarkType, ''>;
  label: string;
  image: string;
};

export const NUTRITION_STRETCH_MARKS: readonly NutritionStretchMarkOption[] = [
  {
    value: 'alba',
    label: 'Alba',
    image: '/clinic/nutricao/estrias/alba.jpg',
  },
  {
    value: 'rubra',
    label: 'Rubra',
    image: '/clinic/nutricao/estrias/rubra.jpg',
  },
];

export type NutritionRectusDiastasisOption = {
  value: Exclude<PatientNutritionRectusDiastasisResult, ''>;
  label: string;
  image: string;
};

export const NUTRITION_RECTUS_DIASTASIS_OPTIONS: readonly NutritionRectusDiastasisOption[] =
  [
    {
      value: 'negativo',
      label: 'Negativo',
      image: '/clinic/nutricao/diastase/negativo.svg',
    },
    {
      value: 'positivo',
      label: 'Positivo',
      image: '/clinic/nutricao/diastase/positivo.svg',
    },
  ];

export type NutritionRectusDiastasisTypeOption = {
  value: Exclude<PatientNutritionRectusDiastasisType, ''>;
  label: string;
  image: string;
};

export const NUTRITION_RECTUS_DIASTASIS_TYPES: readonly NutritionRectusDiastasisTypeOption[] =
  [
    {
      value: 'tipo_a',
      label: 'Tipo A',
      image: '/clinic/nutricao/diastase/tipo-a.svg',
    },
    {
      value: 'tipo_b',
      label: 'Tipo B',
      image: '/clinic/nutricao/diastase/tipo-b.svg',
    },
    {
      value: 'tipo_c',
      label: 'Tipo C',
      image: '/clinic/nutricao/diastase/tipo-c.svg',
    },
    {
      value: 'tipo_d',
      label: 'Tipo D',
      image: '/clinic/nutricao/diastase/tipo-d.svg',
    },
  ];

export type NutritionSkinfold = {
  id: PatientNutritionSkinfoldId;
  label: string;
  /** Título do tooltip (ex.: "Dobra Tricipital"). */
  tooltipTitle: string;
  tooltipText: string;
  image: string;
};

export const NUTRITION_SKINFOLDS: readonly NutritionSkinfold[] = [
  {
    id: 'tricipital',
    label: 'Tricipital',
    tooltipTitle: 'Dobra Tricipital',
    tooltipText:
      'Paralelamente ao eixo longitudinal, no ponto que compreende a metade da distância entre o acrômio e o olécrano.',
    image: '/clinic/nutricao/dobras/tricipital.jpg',
  },
  {
    id: 'subescapular',
    label: 'Subescapular',
    tooltipTitle: 'Dobra Subescapular',
    tooltipText:
      'Obliquamente ao eixo longitudinal, seguindo a orientação dos arcos costais, sendo localizada a dois centímetros abaixo do ângulo inferior da escápula.',
    image: '/clinic/nutricao/dobras/subescapular.jpg',
  },
  {
    id: 'bicipital',
    label: 'Bicipital',
    tooltipTitle: 'Dobra Bicipital',
    tooltipText:
      'É a medida no sentido do eixo longitudinal do braço, na sua face superior, no ponto de maior circunferência aparente do ventre muscular do bíceps.',
    image: '/clinic/nutricao/dobras/bicipital.jpg',
  },
  {
    id: 'axilar',
    label: 'Axilar',
    tooltipTitle: 'Dobra Axilar',
    tooltipText:
      'Ponto de intersecção entre a linha axilar média e uma linha imaginária transversal na altura do apêndice xifóide do esterno. A medida é realizada obliquamente.',
    image: '/clinic/nutricao/dobras/axilar.jpg',
  },
  {
    id: 'iliaca',
    label: 'Ilíaca',
    tooltipTitle: 'Dobra Ilíaca',
    tooltipText:
      'Ponto localizado 3 cm acima do bordo ilíaco látero-superior. Para se tomar a medida utiliza-se o mesmo sentido do osso ilíaco (pinçamento diagonal).',
    image: '/clinic/nutricao/dobras/iliaca.jpg',
  },
  {
    id: 'supraespinhal',
    label: 'Supraespinhal',
    tooltipTitle: 'Dobra Supraespinhal',
    tooltipText:
      'Obliquamente em relação ao eixo longitudinal, na metade da distância entre o último arco costal e a crista ilíaca, sobre a linha axilar medial.',
    image: '/clinic/nutricao/dobras/supraespinhal.jpg',
  },
  {
    id: 'abdominal',
    label: 'Abdominal',
    tooltipTitle: 'Dobra Abdominal',
    tooltipText:
      'Paralelamente ao eixo longitudinal, 2 cm à direita da cicatriz umbilical.',
    image: '/clinic/nutricao/dobras/abdominal.jpg',
  },
  {
    id: 'coxa',
    label: 'Coxa',
    tooltipTitle: 'Dobra da Coxa',
    tooltipText:
      'Paralelamente ao eixo longitudinal, sobre o músculo reto femoral, a um terço da distância do ligamento inguinal e a borda superior da patela.',
    image: '/clinic/nutricao/dobras/coxa.jpg',
  },
  {
    id: 'panturrilha',
    label: 'Panturrilha',
    tooltipTitle: 'Dobra da Panturrilha',
    tooltipText:
      'Sentado, com o joelho flexionado em 90º, o tornozelo em posição anatômica e o pé sem apoio. A dobra é pinçada no ponto de maior perímetro da perna.',
    image: '/clinic/nutricao/dobras/panturrilha.jpg',
  },
];

export const NUTRITION_ADIPOMETRY_PROTOCOLS = [
  { value: 'petroski', label: 'Petróski' },
] as const;

/**
 * Dobras exigidas pelo protocolo de Petróski. `other` segue o conjunto
 * masculino, como já acontece na silhueta do IMC.
 */
const PETROSKI_REQUIRED_SKINFOLDS: Record<
  'male' | 'female',
  readonly PatientNutritionSkinfoldId[]
> = {
  male: ['tricipital', 'subescapular', 'iliaca', 'panturrilha'],
  female: ['axilar', 'iliaca', 'coxa', 'panturrilha'],
};

export function toPatientGender(
  value: string | null | undefined,
): PatientGender | null {
  return value === 'male' || value === 'female' || value === 'other'
    ? value
    : null;
}

export function petroskiRequiredSkinfolds(
  gender: PatientGender | null | undefined,
): readonly PatientNutritionSkinfoldId[] {
  return gender === 'female'
    ? PETROSKI_REQUIRED_SKINFOLDS.female
    : PETROSKI_REQUIRED_SKINFOLDS.male;
}

function createEmptyMeasures(): PatientNutritionSkinfoldMeasures {
  return { first: '', second: '', third: '' };
}

export function createEmptyNutritionBody(): PatientNutritionBody {
  return {
    fatDistribution: '',
    celluliteGrade: '',
    stretchMarks: '',
    notes: '',
    rectusDiastasis: '',
    rectusDiastasisType: '',
    rectusDiastasisNotes: '',
    perceivedAppearance: '',
    desiredAppearance: '',
    weightKg: '',
    heightCm: '',
    adipometryProtocol: '',
    skinfolds: NUTRITION_SKINFOLDS.reduce(
      (accumulated, skinfold) => ({
        ...accumulated,
        [skinfold.id]: createEmptyMeasures(),
      }),
      {} as PatientNutritionBody['skinfolds'],
    ),
    girths: createEmptyNutritionGirths(),
    customGirths: [],
  };
}

/** Converte texto de input em número, aceitando vírgula decimal. */
export function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Mediana das medidas preenchidas; `null` enquanto nenhuma for válida. */
export function skinfoldMedian(
  measures: PatientNutritionSkinfoldMeasures,
): number | null {
  const values = [measures.first, measures.second, measures.third]
    .map(parseDecimalInput)
    .filter((value): value is number => value != null)
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 1
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;

  return Math.round(median * 10) / 10;
}

export function countValidSkinfoldMeasures(
  measures: PatientNutritionSkinfoldMeasures,
): number {
  return [measures.first, measures.second, measures.third]
    .map(parseDecimalInput)
    .filter((value): value is number => value != null).length;
}

/** Qualquer medida válida (ex.: exibição de mediana). */
export function hasSkinfoldMeasure(
  measures: PatientNutritionSkinfoldMeasures,
): boolean {
  return skinfoldMedian(measures) != null;
}

/**
 * Petróski exige no mínimo 2 medidas válidas por dobra obrigatória
 * (a 3ª é opcional e entra na mediana).
 */
export function hasSkinfoldMeasuresForPetroski(
  measures: PatientNutritionSkinfoldMeasures,
): boolean {
  return countValidSkinfoldMeasures(measures) >= 2;
}

/** Dobras exigidas por Petróski sem ≥2 medidas válidas. */
export function missingPetroskiSkinfolds(
  body: PatientNutritionBody,
  gender: PatientGender | null | undefined,
): readonly PatientNutritionSkinfoldId[] {
  return petroskiRequiredSkinfolds(gender).filter(
    (id) => !hasSkinfoldMeasuresForPetroski(body.skinfolds[id]),
  );
}

export function hasNutritionBmiFilled(body: PatientNutritionBody): boolean {
  return (
    parseDecimalInput(body.weightKg) != null &&
    parseDecimalInput(body.heightCm) != null
  );
}

/**
 * Mensagem de erro ao salvar com Petróski incompleto; `null` se ok ou
 * protocolo não selecionado.
 */
export function validatePetroskiBodyForSave(
  body: PatientNutritionBody,
  gender: PatientGender | null | undefined,
  ageYears: number | null,
): string | null {
  if (body.adipometryProtocol !== 'petroski') {
    return null;
  }

  if (ageYears == null || ageYears <= 0) {
    return 'Informe a data de nascimento do paciente para usar o protocolo de Petróski.';
  }

  if (!hasNutritionBmiFilled(body)) {
    return 'É necessário preencher peso e altura (IMC) para usar o protocolo de Petróski.';
  }

  if (missingPetroskiSkinfolds(body, gender).length > 0) {
    return 'Informe ao menos 2 medidas em cada dobra obrigatória do protocolo de Petróski.';
  }

  return null;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function parseMeasures(raw: unknown): PatientNutritionSkinfoldMeasures {
  if (!raw || typeof raw !== 'object') return createEmptyMeasures();

  const source = raw as Record<string, unknown>;
  return {
    first: readString(source, 'first'),
    second: readString(source, 'second'),
    third: readString(source, 'third'),
  };
}

function parseFatDistribution(value: unknown): PatientNutritionFatDistribution {
  return NUTRITION_FAT_DISTRIBUTION_OPTIONS.some(
    (option) => option.value === value,
  )
    ? (value as PatientNutritionFatDistribution)
    : '';
}

function parseCelluliteGrade(value: unknown): PatientNutritionCelluliteGrade {
  return NUTRITION_CELLULITE_GRADES.some((grade) => grade.value === value)
    ? (value as PatientNutritionCelluliteGrade)
    : '';
}

function parseStretchMarks(value: unknown): PatientNutritionStretchMarkType {
  return NUTRITION_STRETCH_MARKS.some((mark) => mark.value === value)
    ? (value as PatientNutritionStretchMarkType)
    : '';
}

function parseRectusDiastasis(
  value: unknown,
): PatientNutritionRectusDiastasisResult {
  return NUTRITION_RECTUS_DIASTASIS_OPTIONS.some(
    (option) => option.value === value,
  )
    ? (value as PatientNutritionRectusDiastasisResult)
    : '';
}

function parseRectusDiastasisType(
  value: unknown,
): PatientNutritionRectusDiastasisType {
  return NUTRITION_RECTUS_DIASTASIS_TYPES.some(
    (option) => option.value === value,
  )
    ? (value as PatientNutritionRectusDiastasisType)
    : '';
}

function parseProtocol(value: unknown): PatientNutritionAdipometryProtocol {
  return NUTRITION_ADIPOMETRY_PROTOCOLS.some(
    (protocol) => protocol.value === value,
  )
    ? (value as PatientNutritionAdipometryProtocol)
    : '';
}

/** Lê a aba Corporal do JSON persistido, ignorando o que estiver fora do catálogo. */
export function parseNutritionBody(section: unknown): PatientNutritionBody {
  if (!section || typeof section !== 'object') {
    return createEmptyNutritionBody();
  }

  const source = section as Record<string, unknown>;
  const rawSkinfolds =
    source.skinfolds && typeof source.skinfolds === 'object'
      ? (source.skinfolds as Record<string, unknown>)
      : {};

  return {
    fatDistribution: parseFatDistribution(source.fatDistribution),
    celluliteGrade: parseCelluliteGrade(source.celluliteGrade),
    stretchMarks: parseStretchMarks(source.stretchMarks),
    notes: readString(source, 'notes'),
    rectusDiastasis: parseRectusDiastasis(source.rectusDiastasis),
    rectusDiastasisType: parseRectusDiastasisType(source.rectusDiastasisType),
    rectusDiastasisNotes: readString(source, 'rectusDiastasisNotes'),
    perceivedAppearance: parseNutritionAppearance(source.perceivedAppearance),
    desiredAppearance: parseNutritionAppearance(source.desiredAppearance),
    weightKg: readString(source, 'weightKg'),
    heightCm: readString(source, 'heightCm'),
    adipometryProtocol: parseProtocol(source.adipometryProtocol),
    skinfolds: NUTRITION_SKINFOLDS.reduce(
      (accumulated, skinfold) => ({
        ...accumulated,
        [skinfold.id]: parseMeasures(rawSkinfolds[skinfold.id]),
      }),
      {} as PatientNutritionBody['skinfolds'],
    ),
    girths: parseNutritionGirths(source.girths),
    customGirths: parseNutritionCustomGirths(source.customGirths),
  };
}

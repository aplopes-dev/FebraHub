import { parseLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import type {
  DashboardAgeBucketKey,
  DashboardAgeSeriesPoint,
  DashboardDemographicPatient,
  DashboardGenderFilter,
  DashboardGenderShare,
  DashboardPatientDemographicsResult,
  DashboardPatientGender,
} from '../types/clinic-dashboard';
import { GENDER_COLORS } from '../data/mock-dashboard-patient-demographics';

export const GENDER_FILTER_OPTIONS: Array<{
  value: DashboardGenderFilter;
  label: string;
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'uninformed', label: 'Não informado' },
];

/** Faixas etárias do eixo Y (ordem: não informado → décadas → 100+). */
export const AGE_BUCKET_ORDER: readonly DashboardAgeBucketKey[] = [
  'unknown',
  '0-9',
  '10-19',
  '20-29',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70-79',
  '80-89',
  '90-99',
  '100+',
] as const;

const AGE_BUCKET_LABELS: Record<DashboardAgeBucketKey, string> = {
  unknown: 'Idade não informado',
  '0-9': '0 a 9 anos',
  '10-19': '10 a 19 anos',
  '20-29': '20 a 29 anos',
  '30-39': '30 a 39 anos',
  '40-49': '40 a 49 anos',
  '50-59': '50 a 59 anos',
  '60-69': '60 a 69 anos',
  '70-79': '70 a 79 anos',
  '80-89': '80 a 89 anos',
  '90-99': '90 a 99 anos',
  '100+': '100 anos ou mais',
};

export function getDashboardGenderLabel(
  gender: DashboardPatientGender,
): string {
  if (gender === 'female') return 'Feminino';
  if (gender === 'male') return 'Masculino';
  return 'Não informado';
}

export function calcAgeYears(
  birthDate: string,
  today: Date,
): number {
  const birth = parseLocalDateString(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function resolveAgeBucket(
  birthDate: string | null,
  today: Date,
): DashboardAgeBucketKey {
  if (!birthDate) return 'unknown';
  const age = calcAgeYears(birthDate, today);
  if (age >= 100) return '100+';
  if (age >= 90) return '90-99';
  if (age >= 80) return '80-89';
  if (age >= 70) return '70-79';
  if (age >= 60) return '60-69';
  if (age >= 50) return '50-59';
  if (age >= 40) return '40-49';
  if (age >= 30) return '30-39';
  if (age >= 20) return '20-29';
  if (age >= 10) return '10-19';
  return '0-9';
}

export function ageBucketToKey(bucket: DashboardAgeBucketKey): string {
  return bucket;
}

export function ageBucketLabel(bucket: DashboardAgeBucketKey): string {
  return AGE_BUCKET_LABELS[bucket];
}

export function filterPatientsByGender(
  patients: readonly DashboardDemographicPatient[],
  filter: DashboardGenderFilter,
): DashboardDemographicPatient[] {
  if (filter === 'all') return [...patients];
  return patients.filter((patient) => patient.gender === filter);
}

/**
 * Série completa das 12 faixas (inclui count 0) para o eixo Y fixo.
 */
export function buildAgePercentSeries(
  patients: readonly DashboardDemographicPatient[],
  genderFilter: DashboardGenderFilter,
  today: Date,
): DashboardAgeSeriesPoint[] {
  const filtered = filterPatientsByGender(patients, genderFilter);
  const total = filtered.length;
  const counts = new Map<DashboardAgeBucketKey, number>();

  for (const patient of filtered) {
    const bucket = resolveAgeBucket(patient.birthDate, today);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return AGE_BUCKET_ORDER.map((bucket) => {
    const count = counts.get(bucket) ?? 0;
    return {
      key: ageBucketToKey(bucket),
      label: ageBucketLabel(bucket),
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

/** Apenas buckets com count > 0 (PDF / legendas compactas). */
export function buildAgePercentSeriesSparse(
  patients: readonly DashboardDemographicPatient[],
  genderFilter: DashboardGenderFilter,
  today: Date,
): DashboardAgeSeriesPoint[] {
  return buildAgePercentSeries(patients, genderFilter, today).filter(
    (point) => point.count > 0,
  );
}

const AGE_PERCENT_AXIS_STEP = 20;
const AGE_PERCENT_AXIS_MIN = 20;
const AGE_PERCENT_AXIS_CAP = 100;
const AGE_PERCENT_AXIS_TICK_COUNT = 4;

/**
 * Escala o eixo X (%) do gráfico de idade ao máximo relevante:
 * se o pico for menor que 20%, o eixo para em 20% (não em 80%).
 */
export function resolveAgePercentChartAxis(
  maxPercent: number,
): { max: number; ticks: number[] } {
  const safeMax = Number.isFinite(maxPercent) ? Math.max(0, maxPercent) : 0;
  const ceiled =
    Math.ceil(safeMax / AGE_PERCENT_AXIS_STEP) * AGE_PERCENT_AXIS_STEP;
  const max = Math.min(
    AGE_PERCENT_AXIS_CAP,
    Math.max(AGE_PERCENT_AXIS_MIN, ceiled || AGE_PERCENT_AXIS_MIN),
  );
  const step = max / AGE_PERCENT_AXIS_TICK_COUNT;
  const ticks = Array.from(
    { length: AGE_PERCENT_AXIS_TICK_COUNT + 1 },
    (_, index) => Math.round(step * index * 10) / 10,
  );
  return { max, ticks };
}

export function aggregateGenderShares(
  patients: readonly DashboardDemographicPatient[],
): DashboardGenderShare[] {
  const total = patients.length;
  const order: DashboardPatientGender[] = ['female', 'male', 'uninformed'];
  const counts = new Map<DashboardPatientGender, number>();

  for (const patient of patients) {
    counts.set(patient.gender, (counts.get(patient.gender) ?? 0) + 1);
  }

  return order
    .filter((gender) => (counts.get(gender) ?? 0) > 0)
    .map((gender) => {
      const count = counts.get(gender) ?? 0;
      return {
        gender,
        label: getDashboardGenderLabel(gender),
        color: GENDER_COLORS[gender],
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    });
}

/** Anexa cores do gráfico às fatias de sexo vindas da API. */
export function mapGenderSharesWithColors(
  shares: DashboardPatientDemographicsResult['genderShares'],
): DashboardGenderShare[] {
  return shares.map((share) => ({
    ...share,
    color: GENDER_COLORS[share.gender],
  }));
}

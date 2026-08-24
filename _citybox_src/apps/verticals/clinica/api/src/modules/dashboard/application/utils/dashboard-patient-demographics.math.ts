import { calculateAgeYears } from '../../../patients/domain/utils/birthday-window.utils';
import type {
  DashboardAgeSeriesPoint,
  DashboardDemographicGender,
  DashboardDemographicGenderFilter,
  DashboardGenderShare,
  PatientDemographicsRow,
} from './dashboard-patient-demographics.types';

const GENDER_LABELS: Record<DashboardDemographicGender, string> = {
  female: 'Feminino',
  male: 'Masculino',
  uninformed: 'Não informado',
};

const GENDER_SHARE_ORDER: DashboardDemographicGender[] = [
  'female',
  'male',
  'uninformed',
];

/** Faixas etárias do eixo Y (ordem: não informado → décadas → 100+). */
export type AgeBucketKey =
  | 'unknown'
  | '0-9'
  | '10-19'
  | '20-29'
  | '30-39'
  | '40-49'
  | '50-59'
  | '60-69'
  | '70-79'
  | '80-89'
  | '90-99'
  | '100+';

export const AGE_BUCKET_ORDER: readonly AgeBucketKey[] = [
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

const AGE_BUCKET_LABELS: Record<AgeBucketKey, string> = {
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

export function mapPatientGenderToUi(
  gender: PatientDemographicsRow['gender'],
): DashboardDemographicGender {
  if (gender === 'male' || gender === 'female') return gender;
  return 'uninformed';
}

export function resolveAgeBucket(
  birthDate: Date | null,
  now: Date,
): AgeBucketKey {
  if (birthDate == null) return 'unknown';
  const age = calculateAgeYears(birthDate, now);
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

export function ageBucketToKey(bucket: AgeBucketKey): string {
  return bucket;
}

export function ageBucketLabel(bucket: AgeBucketKey): string {
  return AGE_BUCKET_LABELS[bucket];
}

function matchesGenderFilter(
  uiGender: DashboardDemographicGender,
  filter: DashboardDemographicGenderFilter,
): boolean {
  if (filter === 'all') return true;
  return uiGender === filter;
}

function percentOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

/**
 * Série etária completa (12 faixas), após filtro de sexo —
 * inclui buckets com count 0 para o eixo Y fixo.
 */
export function buildAgeSeries(
  rows: readonly PatientDemographicsRow[],
  genderFilter: DashboardDemographicGenderFilter,
  now: Date,
): { filteredTotalCount: number; ageSeries: DashboardAgeSeriesPoint[] } {
  const filtered = rows.filter((row) =>
    matchesGenderFilter(mapPatientGenderToUi(row.gender), genderFilter),
  );
  const filteredTotalCount = filtered.length;
  const counts = new Map<AgeBucketKey, number>();

  for (const row of filtered) {
    const bucket = resolveAgeBucket(row.birthDate, now);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const ageSeries = AGE_BUCKET_ORDER.map((bucket) => {
    const count = counts.get(bucket) ?? 0;
    return {
      key: ageBucketToKey(bucket),
      label: ageBucketLabel(bucket),
      count,
      percent: percentOf(count, filteredTotalCount),
    };
  });

  return { filteredTotalCount, ageSeries };
}

/** @deprecated Use `buildAgeSeries` — mantido como alias. */
export const buildAgeSeriesSparse = buildAgeSeries;

/** Pizza sempre sobre a base completa (sem filtro de sexo). */
export function aggregateGenderShares(
  rows: readonly PatientDemographicsRow[],
): DashboardGenderShare[] {
  const totalCount = rows.length;
  const counts = new Map<DashboardDemographicGender, number>();

  for (const row of rows) {
    const gender = mapPatientGenderToUi(row.gender);
    counts.set(gender, (counts.get(gender) ?? 0) + 1);
  }

  return GENDER_SHARE_ORDER.filter(
    (gender) => (counts.get(gender) ?? 0) > 0,
  ).map((gender) => {
    const count = counts.get(gender) ?? 0;
    return {
      gender,
      label: GENDER_LABELS[gender],
      count,
      percent: percentOf(count, totalCount),
    };
  });
}

export function buildPatientDemographics(input: {
  rows: readonly PatientDemographicsRow[];
  genderFilter: DashboardDemographicGenderFilter;
  now: Date;
}): {
  filteredTotalCount: number;
  totalCount: number;
  ageSeries: DashboardAgeSeriesPoint[];
  genderShares: DashboardGenderShare[];
} {
  const { filteredTotalCount, ageSeries } = buildAgeSeries(
    input.rows,
    input.genderFilter,
    input.now,
  );

  return {
    filteredTotalCount,
    totalCount: input.rows.length,
    ageSeries,
    genderShares: aggregateGenderShares(input.rows),
  };
}

export type PatientObesityType =
  | 'ausente'
  | 'sobrepeso'
  | 'grau_1'
  | 'grau_2'
  | 'grau_3';

export type PatientRiskGrade =
  | 'abaixo_normal'
  | 'saudavel'
  | 'moderado'
  | 'alto'
  | 'muito_alto'
  | 'extremo';

/** Variante visual da silhueta IMC (`male_1`/`female_1` … `_6`). */
export type PatientImcSilhouetteVariant = 1 | 2 | 3 | 4 | 5 | 6;

export type PatientImcSilhouetteSex = 'male' | 'female';

export type PatientImcStage = {
  obesityType: PatientObesityType;
  riskGrade: PatientRiskGrade;
  obesityTypeLabel: string;
  riskGradeLabel: string;
  silhouetteVariant: PatientImcSilhouetteVariant;
};

const STAGE_CATALOG: ReadonlyArray<
  PatientImcStage & { minInclusive: number; maxExclusive: number | null }
> = [
  {
    minInclusive: 0,
    maxExclusive: 18.5,
    obesityType: 'ausente',
    riskGrade: 'abaixo_normal',
    obesityTypeLabel: 'Ausente',
    riskGradeLabel: 'Peso abaixo do normal',
    silhouetteVariant: 1,
  },
  {
    minInclusive: 18.5,
    maxExclusive: 25,
    obesityType: 'ausente',
    riskGrade: 'saudavel',
    obesityTypeLabel: 'Ausente',
    riskGradeLabel: 'Peso saudável',
    silhouetteVariant: 2,
  },
  {
    minInclusive: 25,
    maxExclusive: 30,
    obesityType: 'sobrepeso',
    riskGrade: 'moderado',
    obesityTypeLabel: 'Sobrepeso',
    riskGradeLabel: 'Moderado',
    silhouetteVariant: 3,
  },
  {
    minInclusive: 30,
    maxExclusive: 35,
    obesityType: 'grau_1',
    riskGrade: 'alto',
    obesityTypeLabel: 'Grau I',
    riskGradeLabel: 'Alto',
    silhouetteVariant: 4,
  },
  {
    minInclusive: 35,
    maxExclusive: 40,
    obesityType: 'grau_2',
    riskGrade: 'muito_alto',
    obesityTypeLabel: 'Grau II',
    riskGradeLabel: 'Muito alto',
    silhouetteVariant: 5,
  },
  {
    minInclusive: 40,
    maxExclusive: null,
    obesityType: 'grau_3',
    riskGrade: 'extremo',
    obesityTypeLabel: 'Grau III (mórbida)',
    riskGradeLabel: 'Extremo',
    silhouetteVariant: 6,
  },
];

export function calculatePatientBmi(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) {
    return null;
  }
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function resolvePatientImcStage(bmi: number): PatientImcStage | null {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return null;
  }

  for (const stage of STAGE_CATALOG) {
    const belowMax = stage.maxExclusive == null || bmi < stage.maxExclusive;
    if (bmi >= stage.minInclusive && belowMax) {
      return {
        obesityType: stage.obesityType,
        riskGrade: stage.riskGrade,
        obesityTypeLabel: stage.obesityTypeLabel,
        riskGradeLabel: stage.riskGradeLabel,
        silhouetteVariant: stage.silhouetteVariant,
      };
    }
  }

  return null;
}

/** Mulher → female_*; homem e demais → male_*. */
export function patientGenderToImcSilhouetteSex(
  gender: 'male' | 'female' | 'other',
): PatientImcSilhouetteSex {
  return gender === 'female' ? 'female' : 'male';
}

export function patientImcSilhouetteSrc(
  variant: PatientImcSilhouetteVariant,
  sex: PatientImcSilhouetteSex = 'male',
): string {
  return `/clinic/imc/${sex}_${variant}.svg`;
}

/** Figura padrão do mapa anatômico (peso saudável). */
export const ANATOMICAL_MAP_DEFAULT_SILHOUETTE_VARIANT: PatientImcSilhouetteVariant = 2;

export function corpogramGenderToImcSilhouetteSex(
  gender: 'woman' | 'man',
): PatientImcSilhouetteSex {
  return gender === 'woman' ? 'female' : 'male';
}

export function formatPatientBmi(bmi: number): string {
  return bmi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

import type { PatientImcSilhouetteSex } from '@/lib/patient-imc';
import type { PatientNutritionAppearanceLevel } from '../types/patient-nutrition-body';

/**
 * Escala de silhuetas de aparência percebida/desejada (1 a 9). Os níveis são
 * persistidos no JSON da inicialização.
 */
export const NUTRITION_APPEARANCE_LEVELS: readonly PatientNutritionAppearanceLevel[] =
  [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function nutritionAppearanceSilhouetteSrc(
  level: PatientNutritionAppearanceLevel,
  sex: PatientImcSilhouetteSex,
): string {
  return `/clinic/nutricao/aparencia/${sex}-${level}.svg`;
}

/** Aceita só níveis do catálogo; `''` quando o profissional não escolheu. */
export function parseNutritionAppearance(
  value: unknown,
): PatientNutritionAppearanceLevel | '' {
  return NUTRITION_APPEARANCE_LEVELS.some((level) => level === value)
    ? (value as PatientNutritionAppearanceLevel)
    : '';
}

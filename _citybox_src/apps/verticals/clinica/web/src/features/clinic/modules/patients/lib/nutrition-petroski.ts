import { calculateAge } from './calculate-age';
import {
  NUTRITION_SKINFOLDS,
  missingPetroskiSkinfolds,
  parseDecimalInput,
  petroskiRequiredSkinfolds,
  skinfoldMedian,
} from './nutrition-body-composition';
import type { PatientGender } from '../types/patient-form';
import type {
  PatientNutritionBody,
  PatientNutritionSkinfoldId,
} from '../types/patient-nutrition-body';

export type PetroskiSkinfoldMedian = {
  id: PatientNutritionSkinfoldId;
  label: string;
  medianMm: number;
};

export type PetroskiComposition = {
  bodyDensity: number;
  fatPercent: number;
  fatMassKg: number;
  leanMassKg: number;
  medians: readonly PetroskiSkinfoldMedian[];
};

export function ageYearsFromBirthDate(
  birthDate: string | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  const trimmed = birthDate?.trim();
  if (!trimmed) return null;

  const age = calculateAge(trimmed, referenceDate);
  return age > 0 ? age : null;
}

/**
 * Densidade corporal + % gordura (Siri) + massas — Petróski 1995 (4 dobras).
 * Retorna `null` se protocolo incompleto (dobras ≥2 medidas, peso, altura, idade).
 */
export function calculatePetroskiComposition(input: {
  body: PatientNutritionBody;
  gender: PatientGender | null | undefined;
  ageYears: number | null;
}): PetroskiComposition | null {
  const { body, gender, ageYears } = input;

  if (body.adipometryProtocol !== 'petroski') {
    return null;
  }

  if (ageYears == null || ageYears <= 0) {
    return null;
  }

  const weightKg = parseDecimalInput(body.weightKg);
  const heightCm = parseDecimalInput(body.heightCm);
  if (weightKg == null || heightCm == null) {
    return null;
  }

  if (missingPetroskiSkinfolds(body, gender).length > 0) {
    return null;
  }

  const requiredIds = petroskiRequiredSkinfolds(gender);
  const requiredMedians: PetroskiSkinfoldMedian[] = [];

  for (const id of requiredIds) {
    const medianMm = skinfoldMedian(body.skinfolds[id]);
    if (medianMm == null) {
      return null;
    }

    const label =
      NUTRITION_SKINFOLDS.find((skinfold) => skinfold.id === id)?.label ?? id;
    requiredMedians.push({ id, label, medianMm });
  }

  // Gráfico: todas as dobras com mediana (obrigatórias + extras preenchidas).
  const medians: PetroskiSkinfoldMedian[] = NUTRITION_SKINFOLDS.flatMap(
    (skinfold) => {
      const medianMm = skinfoldMedian(body.skinfolds[skinfold.id]);
      if (medianMm == null) {
        return [];
      }
      return [{ id: skinfold.id, label: skinfold.label, medianMm }];
    },
  );

  const sum = requiredMedians.reduce((total, item) => total + item.medianMm, 0);
  const isFemale = gender === 'female';

  const bodyDensity = isFemale
    ? 1.0346585 -
      0.00063129 * sum +
      0.00000187 * sum * sum -
      0.00031165 * ageYears -
      0.0004889 * weightKg +
      0.00051345 * heightCm
    : 1.10726863 -
      0.00081201 * sum +
      0.00000212 * sum * sum -
      0.00041761 * ageYears;

  if (!Number.isFinite(bodyDensity) || bodyDensity <= 0) {
    return null;
  }

  // Siri (1961)
  const fatPercent = (4.95 / bodyDensity - 4.5) * 100;
  if (!Number.isFinite(fatPercent) || fatPercent < 0 || fatPercent > 100) {
    return null;
  }

  const fatMassKg = Math.round(weightKg * (fatPercent / 100) * 100) / 100;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 100) / 100;

  return {
    bodyDensity: Math.round(bodyDensity * 1_000_000) / 1_000_000,
    fatPercent: Math.round(fatPercent * 100) / 100,
    fatMassKg,
    leanMassKg,
    medians,
  };
}

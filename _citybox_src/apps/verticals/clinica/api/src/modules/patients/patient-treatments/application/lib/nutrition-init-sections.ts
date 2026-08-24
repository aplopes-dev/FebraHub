import type {
  NutritionInitSectionKey,
  NutritionInitSectionPayload,
} from '../../domain/types/patient-nutrition-initiation';

/** O conteúdo das seções é JSON livre: só interessa saber se algo foi preenchido. */
function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasContent);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasContent);
  }
  return false;
}

export function filledNutritionSections(sections: {
  anamnesis: NutritionInitSectionPayload;
  body: NutritionInitSectionPayload;
  treatmentPlan: NutritionInitSectionPayload;
}): NutritionInitSectionKey[] {
  const keys: NutritionInitSectionKey[] = ['anamnesis', 'body', 'treatmentPlan'];
  return keys.filter((key) => hasContent(sections[key]));
}

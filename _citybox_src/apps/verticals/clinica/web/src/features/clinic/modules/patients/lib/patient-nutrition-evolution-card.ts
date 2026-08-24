import type {
  PatientNutritionInitiationSummaryApiItem,
  PatientNutritionInitSectionKey,
} from '../types/patient-nutrition-init';

export const NUTRITION_SECTION_LABEL: Record<
  PatientNutritionInitSectionKey,
  string
> = {
  anamnesis: 'Anamnese',
  body: 'Corporal',
  treatmentPlan: 'Plano de procedimento',
};

export type PatientNutritionEvolutionMeta = {
  treatmentId: string;
  filledSections: PatientNutritionInitSectionKey[];
};

export function indexNutritionInitiationsByEvolution(
  items: readonly PatientNutritionInitiationSummaryApiItem[],
): Record<string, PatientNutritionEvolutionMeta> {
  return items.reduce<Record<string, PatientNutritionEvolutionMeta>>(
    (accumulator, item) => ({
      ...accumulator,
      [item.evolutionId]: {
        treatmentId: item.treatmentId,
        filledSections: item.filledSections,
      },
    }),
    {},
  );
}

export function formatNutritionSections(
  sections: readonly PatientNutritionInitSectionKey[],
): string {
  return sections.map((section) => NUTRITION_SECTION_LABEL[section]).join(', ');
}

/** `qui, 13 de agosto de 2026` */
export function formatNutritionEvolutionDate(isoDate: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).formatToParts(new Date(isoDate));

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  const weekday = part('weekday').replace('.', '');
  return `${weekday}, ${part('day')} de ${part('month')} de ${part('year')}`;
}

/** `16:58` — horário do `initiatedAt` / salvamento. */
export function formatNutritionEvolutionTime(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

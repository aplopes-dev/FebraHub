/**
 * Plano de procedimento do fluxo "Inicializar" da nutrição — cinco blocos de
 * texto rico gravados no JSON da inicialização.
 */
export type PatientNutritionTreatmentPlanFieldId =
  | 'plan'
  | 'labTests'
  | 'planning'
  | 'prescription'
  | 'homeCare';

/** Cada campo guarda o HTML do editor de texto rico. */
export type PatientNutritionTreatmentPlan = Record<
  PatientNutritionTreatmentPlanFieldId,
  string
>;

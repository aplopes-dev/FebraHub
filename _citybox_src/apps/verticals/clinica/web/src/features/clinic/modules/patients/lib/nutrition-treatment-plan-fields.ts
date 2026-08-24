import type {
  PatientNutritionTreatmentPlan,
  PatientNutritionTreatmentPlanFieldId,
} from '../types/patient-nutrition-treatment-plan';

export type NutritionTreatmentPlanField = {
  id: PatientNutritionTreatmentPlanFieldId;
  label: string;
  placeholder: string;
};

/**
 * Campos da aba "Plano de procedimento". Os `id` são persistidos no JSON da
 * inicialização — alterá-los descarta conteúdo já gravado.
 */
export const NUTRITION_TREATMENT_PLAN_FIELDS: readonly NutritionTreatmentPlanField[] =
  [
    {
      id: 'plan',
      label: 'Plano de procedimento',
      placeholder: 'Descreva o plano de procedimento…',
    },
    {
      id: 'labTests',
      label: 'Exames laboratoriais',
      placeholder: 'Exames solicitados e resultados…',
    },
    {
      id: 'planning',
      label: 'Planejamento',
      placeholder: 'Etapas, metas e cronograma…',
    },
    {
      id: 'prescription',
      label: 'Prescrição',
      placeholder: 'Prescrição nutricional…',
    },
    {
      id: 'homeCare',
      label: 'Cuidados e home care',
      placeholder: 'Orientações de cuidado em casa…',
    },
  ];

export function createEmptyNutritionTreatmentPlan(): PatientNutritionTreatmentPlan {
  return NUTRITION_TREATMENT_PLAN_FIELDS.reduce<PatientNutritionTreatmentPlan>(
    (accumulated, field) => ({ ...accumulated, [field.id]: '' }),
    {} as PatientNutritionTreatmentPlan,
  );
}

/** Lê o plano do JSON persistido, ignorando campos fora do catálogo. */
export function parseNutritionTreatmentPlan(
  section: unknown,
): PatientNutritionTreatmentPlan {
  if (!section || typeof section !== 'object') {
    return createEmptyNutritionTreatmentPlan();
  }

  const source = section as Record<string, unknown>;

  return NUTRITION_TREATMENT_PLAN_FIELDS.reduce<PatientNutritionTreatmentPlan>(
    (accumulated, field) => {
      const value = source[field.id];
      return {
        ...accumulated,
        [field.id]: typeof value === 'string' ? value : '',
      };
    },
    {} as PatientNutritionTreatmentPlan,
  );
}

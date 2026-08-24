import type { PatientBudget } from '../types/patient-budget';
import type { PatientTreatment } from '../types/patient-treatment';
import { buildBudgetTreatmentId } from './patient-treatment-ui';

export function deriveBudgetTreatments(
  budgets: PatientBudget[],
  finalizedIds: ReadonlySet<string>,
): PatientTreatment[] {
  return budgets
    .filter((budget) => budget.status === 'approved')
    .flatMap((budget) =>
      budget.treatments.map((item) => {
        const id = buildBudgetTreatmentId(budget.id, item.id);
        return {
          id,
          patientId: budget.patientId,
          source: 'budget' as const,
          status: finalizedIds.has(id) ? ('finalized' as const) : ('active' as const),
          description: item.treatmentName,
          valueCents: item.valueCents,
          budgetId: budget.id,
          treatmentItemId: item.id,
          toothNumber: item.toothNumber,
          treatmentId: item.treatmentId,
          treatmentName: item.treatmentName,
          planId: item.planId,
          planName: item.planName,
          professionalId: item.professionalId,
          professionalName: item.professionalName,
        };
      }),
    );
}

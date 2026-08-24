import type { PatientTreatment } from '../types/patient-treatment';

/**
 * Nutrição: "Inicializar" não marca `status=finalized` (tratamento segue
 * `active`), mas o id entra em `concludedTreatmentIds`. O toggle "Mostrar
 * finalizados" deve tratá-los como concluídos na lista.
 */
export function isBudgetTreatmentConcludedForDisplay(
  treatment: PatientTreatment,
  concludedTreatmentIds?: ReadonlySet<string>,
): boolean {
  return (
    treatment.status === 'finalized' ||
    Boolean(concludedTreatmentIds?.has(treatment.id))
  );
}

export function filterBudgetTreatmentsForDisplay(
  treatments: PatientTreatment[],
  showFinalized: boolean,
  concludedTreatmentIds?: ReadonlySet<string>,
): PatientTreatment[] {
  return treatments.filter((treatment) => {
    const concluded = isBudgetTreatmentConcludedForDisplay(
      treatment,
      concludedTreatmentIds,
    );
    return showFinalized ? concluded : !concluded;
  });
}

export function paginateTreatments<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) {
    return { items: [], total: 0, totalPages: 1 };
  }

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
  };
}

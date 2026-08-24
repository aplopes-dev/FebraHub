import type { PatientTreatment } from '../types/patient-treatment';

export function applyPatientTreatmentOrder(
  treatments: PatientTreatment[],
  order: string[],
): PatientTreatment[] {
  if (order.length === 0) {
    return treatments;
  }

  const byId = new Map(treatments.map((treatment) => [treatment.id, treatment]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((treatment): treatment is PatientTreatment => treatment !== undefined);
  const unordered = treatments.filter((treatment) => !order.includes(treatment.id));

  return [...ordered, ...unordered];
}

export function mergeReorderedPatientTreatmentIds(
  currentOrder: string[],
  allTreatmentIds: string[],
  reorderedIds: string[],
): string[] {
  const baseOrder = currentOrder.length > 0 ? currentOrder : allTreatmentIds;
  const reorderedIdSet = new Set(reorderedIds);
  const withoutReordered = baseOrder.filter((id) => !reorderedIdSet.has(id));
  const anchorIndex = baseOrder.findIndex((id) => reorderedIdSet.has(id));
  const nextOrder = [...withoutReordered];

  nextOrder.splice(anchorIndex >= 0 ? anchorIndex : nextOrder.length, 0, ...reorderedIds);

  return nextOrder;
}

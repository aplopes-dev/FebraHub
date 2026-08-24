import type { PatientTreatment, PatientTreatmentEditFormValues } from '../types/patient-treatment';

export function applyBudgetTreatmentEdits(
  treatments: PatientTreatment[],
  edits: Readonly<Record<string, PatientTreatmentEditFormValues>>,
): PatientTreatment[] {
  if (Object.keys(edits).length === 0) {
    return treatments;
  }

  return treatments.map((treatment) => {
    if (treatment.source !== 'budget') {
      return treatment;
    }

    const edit = edits[treatment.id];
    if (!edit) {
      return treatment;
    }

    return {
      ...treatment,
      diagnosis: edit.diagnosis,
      observation: edit.observation,
    };
  });
}

import type {
  PatientNutritionInitiationResult,
  PatientNutritionInitiationSummary,
} from '../../../../domain/types/patient-nutrition-initiation';

export function toPatientNutritionInitiationResponse(
  initiation: PatientNutritionInitiationResult,
) {
  return {
    id: initiation.id,
    storeId: initiation.storeId,
    patientId: initiation.patientId,
    treatmentId: initiation.treatmentId,
    evolutionId: initiation.evolutionId,
    patientAnamnesisId: initiation.patientAnamnesisId ?? null,
    anamnesis: initiation.anamnesis,
    body: initiation.body,
    treatmentPlan: initiation.treatmentPlan,
    professionalId: initiation.professionalId,
    professionalName: initiation.professionalName,
    initiatedAt: initiation.initiatedAt.toISOString(),
    createdAt: initiation.createdAt.toISOString(),
    updatedAt: initiation.updatedAt.toISOString(),
  };
}

export function toPatientNutritionInitiationSummaryResponse(
  summary: PatientNutritionInitiationSummary,
) {
  return {
    id: summary.id,
    patientId: summary.patientId,
    treatmentId: summary.treatmentId,
    evolutionId: summary.evolutionId,
    professionalId: summary.professionalId,
    professionalName: summary.professionalName,
    initiatedAt: summary.initiatedAt.toISOString(),
    filledSections: summary.filledSections,
  };
}

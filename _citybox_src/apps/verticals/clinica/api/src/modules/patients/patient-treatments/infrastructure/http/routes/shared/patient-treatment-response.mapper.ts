import type { PatientTreatment } from '../../../../domain/entities/patient-treatment.entity';

export function toPatientTreatmentResponse(treatment: PatientTreatment) {
  return {
    id: treatment.id,
    patientId: treatment.patientId,
    source: treatment.source,
    status: treatment.status,
    budgetId: treatment.budgetId,
    budgetItemId: treatment.budgetItemId,
    planId: treatment.planId,
    treatmentId: treatment.treatmentId,
    professionalId: treatment.professionalId,
    professionalName: treatment.professionalName,
    planName: treatment.planName,
    treatmentName: treatment.treatmentName,
    description: treatment.description,
    valueCents: treatment.valueCents,
    locationType: treatment.locationType,
    locationLabel: treatment.locationLabel,
    sessionIndex: treatment.sessionIndex,
    sessionTotal: treatment.sessionTotal,
    diagnosis: treatment.diagnosis,
    observation: treatment.observation,
    sortOrder: treatment.sortOrder,
    finalizedAt: treatment.finalizedAt?.toISOString() ?? null,
    createdAt: treatment.createdAt.toISOString(),
    updatedAt: treatment.updatedAt.toISOString(),
  };
}

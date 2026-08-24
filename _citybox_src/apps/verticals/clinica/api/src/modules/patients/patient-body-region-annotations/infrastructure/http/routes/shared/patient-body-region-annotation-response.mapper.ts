import type { PatientBodyRegionAnnotation } from '../../../../domain/entities/patient-body-region-annotation.entity';

export function toPatientBodyRegionAnnotationResponse(
  annotation: PatientBodyRegionAnnotation,
) {
  return {
    id: annotation.id,
    patientId: annotation.patientId,
    bodyRegionId: annotation.bodyRegionId,
    content: annotation.content,
    professionalId: annotation.professionalId,
    professionalName: annotation.professionalName,
    createdAt: annotation.createdAt.toISOString(),
  };
}

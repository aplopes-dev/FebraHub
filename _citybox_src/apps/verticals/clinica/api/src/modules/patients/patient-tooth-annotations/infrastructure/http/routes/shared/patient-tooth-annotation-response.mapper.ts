import type { PatientToothAnnotation } from '../../../../domain/entities/patient-tooth-annotation.entity';

export function toPatientToothAnnotationResponse(
  annotation: PatientToothAnnotation,
) {
  return {
    id: annotation.id,
    patientId: annotation.patientId,
    toothNumber: annotation.toothNumber,
    content: annotation.content,
    professionalId: annotation.professionalId,
    professionalName: annotation.professionalName,
    createdAt: annotation.createdAt.toISOString(),
  };
}

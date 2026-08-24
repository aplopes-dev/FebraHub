import type { PatientNutritionNoteResult } from '../../../../domain/types/patient-nutrition-note';

export function toPatientNutritionNoteResponse(note: PatientNutritionNoteResult) {
  return {
    id: note.id,
    patientId: note.patientId,
    evolutionId: note.evolutionId,
    content: note.content,
    attachment: note.attachment
      ? {
          name: note.attachment.name,
          mimeType: note.attachment.mimeType,
          sizeBytes: note.attachment.sizeBytes,
          contentPath: `/api/v1/patients/${note.patientId}/nutrition-notes/${note.id}/content`,
        }
      : null,
    professionalId: note.professionalId,
    professionalName: note.professionalName,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

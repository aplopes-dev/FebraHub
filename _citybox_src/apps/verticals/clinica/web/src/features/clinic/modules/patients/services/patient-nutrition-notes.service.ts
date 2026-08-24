import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
import { toPatientPhotoUrl } from '../lib/patient-api-mappers';
import type {
  PatientNutritionNote,
  PatientNutritionNoteApiItem,
  SavePatientNutritionNoteInput,
} from '../types/patient-nutrition-note';

function toNote(
  row: PatientNutritionNoteApiItem,
  storeId: string,
): PatientNutritionNote {
  return {
    ...row,
    attachment: row.attachment
      ? {
          name: row.attachment.name,
          mimeType: row.attachment.mimeType,
          sizeBytes: row.attachment.sizeBytes,
          contentUrl: toPatientPhotoUrl(storeId, row.attachment.contentPath),
        }
      : null,
  };
}

function toFormData(input: SavePatientNutritionNoteInput): FormData {
  const formData = new FormData();
  formData.append('content', input.content);
  if (input.professionalId) {
    formData.append('professionalId', input.professionalId);
  }
  if (input.professionalName) {
    formData.append('professionalName', input.professionalName);
  }
  if (input.file) {
    formData.append('file', input.file);
  }
  return formData;
}

export async function listPatientNutritionNotes(
  storeId: string,
  patientId: string,
  evolutionId: string,
): Promise<PatientNutritionNote[]> {
  const res = await clinicaFetch<{ data: PatientNutritionNoteApiItem[] }>(
    storeId,
    `/v1/patients/${patientId}/nutrition-inits/${evolutionId}/notes`,
  );

  return res.data.map((row) => toNote(row, storeId));
}

export async function savePatientNutritionNote(
  storeId: string,
  patientId: string,
  input: SavePatientNutritionNoteInput,
): Promise<PatientNutritionNote> {
  const basePath = `/v1/patients/${patientId}/nutrition-inits/${input.evolutionId}/notes`;
  const res = await clinicaUpload<{ data: PatientNutritionNoteApiItem }>(
    storeId,
    input.noteId ? `${basePath}/${input.noteId}` : basePath,
    toFormData(input),
    { method: input.noteId ? 'PATCH' : 'POST' },
  );

  return toNote(res.data, storeId);
}

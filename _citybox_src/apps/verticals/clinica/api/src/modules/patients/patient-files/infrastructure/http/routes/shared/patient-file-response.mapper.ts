import type { PatientFile } from '../../../../domain/entities/patient-file.entity';
import type { PatientFolder } from '../../../../domain/entities/patient-folder.entity';

export function toPatientFolderResponse(folder: PatientFolder) {
  return {
    id: folder.id,
    patientId: folder.patientId,
    parentId: folder.parentId,
    name: folder.name,
    createdAt: folder.createdAt.toISOString(),
  };
}

export function toPatientFileResponse(file: PatientFile) {
  return {
    id: file.id,
    patientId: file.patientId,
    folderId: file.folderId,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    kind: file.kind,
    previewUrl:
      file.kind === 'image'
        ? `/api/v1/patients/${file.patientId}/files/${file.id}/content`
        : undefined,
    createdAt: file.createdAt.toISOString(),
  };
}

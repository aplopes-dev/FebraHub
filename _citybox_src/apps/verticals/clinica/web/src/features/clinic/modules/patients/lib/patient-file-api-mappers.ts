import { toPatientPhotoUrl } from './patient-api-mappers';
import type { PatientFile, PatientFolder, PatientFolderBreadcrumb } from '../types/patient-file';
import type {
  PatientDriveBreadcrumbApiItem,
  PatientFileApiItem,
  PatientFolderApiItem,
} from '../types/patient-file-api';

export function toPatientFileContentUrl(
  storeId: string,
  patientId: string,
  fileId: string,
): string | null {
  return toPatientPhotoUrl(storeId, `/api/v1/patients/${patientId}/files/${fileId}/content`);
}

export function toPatientFolder(row: PatientFolderApiItem): PatientFolder {
  return {
    id: row.id,
    patientId: row.patientId,
    parentId: row.parentId,
    name: row.name,
    createdAt: row.createdAt,
  };
}

export function toPatientFile(row: PatientFileApiItem, storeId: string): PatientFile {
  const contentUrl = toPatientFileContentUrl(storeId, row.patientId, row.id);

  return {
    id: row.id,
    patientId: row.patientId,
    folderId: row.folderId,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    kind: row.kind,
    previewUrl: row.kind === 'image' ? (contentUrl ?? undefined) : undefined,
    contentUrl: contentUrl ?? undefined,
    createdAt: row.createdAt,
  };
}

export function toPatientFolderBreadcrumb(
  items: PatientDriveBreadcrumbApiItem[],
): PatientFolderBreadcrumb[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
  }));
}

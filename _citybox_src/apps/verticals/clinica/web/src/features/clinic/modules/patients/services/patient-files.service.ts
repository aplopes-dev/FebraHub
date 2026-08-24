import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
import {
  toPatientFile,
  toPatientFolder,
  toPatientFolderBreadcrumb,
} from '../lib/patient-file-api-mappers';
import type {
  PatientDriveListResult,
  PatientDriveMoveDestination,
  PatientFile,
  PatientFolder,
  PatientFolderBreadcrumb,
} from '../types/patient-file';
import type {
  PatientDriveBreadcrumbApiItem,
  PatientDriveListParams,
  PatientDriveMoveDestinationApiItem,
  PatientFileApiItem,
  PatientFolderApiItem,
} from '../types/patient-file-api';

type DriveEnvelope = {
  data: {
    folders: PatientFolderApiItem[];
    files: PatientFileApiItem[];
  };
};

type FolderEnvelope = { data: PatientFolderApiItem };
type FileEnvelope = { data: PatientFileApiItem };
type BreadcrumbEnvelope = { data: PatientDriveBreadcrumbApiItem[] };
type MoveDestinationsEnvelope = { data: PatientDriveMoveDestinationApiItem[] };

function buildDriveQuery(params: PatientDriveListParams): string {
  const searchParams = new URLSearchParams();
  if (params.folderId) {
    searchParams.set('folderId', params.folderId);
  }
  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildBreadcrumbQuery(folderId: string | null): string {
  if (!folderId) return '';
  return `?folderId=${encodeURIComponent(folderId)}`;
}

function buildMoveDestinationsQuery(excludeFolderSubtreeId?: string | null): string {
  if (!excludeFolderSubtreeId) return '';
  return `?excludeFolderSubtreeId=${encodeURIComponent(excludeFolderSubtreeId)}`;
}

export async function listPatientDrive(
  storeId: string,
  patientId: string,
  folderId: string | null,
  search?: string,
): Promise<PatientDriveListResult> {
  const res = await clinicaFetch<DriveEnvelope>(
    storeId,
    `/v1/patients/${patientId}/drive${buildDriveQuery({ folderId: folderId ?? undefined, search })}`,
  );

  return {
    folders: res.data.folders.map(toPatientFolder),
    files: res.data.files.map((file) => toPatientFile(file, storeId)),
  };
}

export async function getPatientDriveBreadcrumb(
  storeId: string,
  patientId: string,
  folderId: string | null,
): Promise<PatientFolderBreadcrumb[]> {
  const res = await clinicaFetch<BreadcrumbEnvelope>(
    storeId,
    `/v1/patients/${patientId}/drive/breadcrumb${buildBreadcrumbQuery(folderId)}`,
  );

  return toPatientFolderBreadcrumb(res.data);
}

export async function createPatientFolder(
  storeId: string,
  patientId: string,
  parentId: string | null,
  name: string,
): Promise<PatientFolder> {
  const res = await clinicaFetch<FolderEnvelope>(
    storeId,
    `/v1/patients/${patientId}/folders`,
    {
      method: 'POST',
      body: JSON.stringify({ parentId, name }),
    },
  );

  return toPatientFolder(res.data);
}

export async function uploadPatientFile(
  storeId: string,
  patientId: string,
  folderId: string | null,
  file: File,
): Promise<PatientFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }

  const res = await clinicaUpload<FileEnvelope>(
    storeId,
    `/v1/patients/${patientId}/files`,
    formData,
  );

  return toPatientFile(res.data, storeId);
}

export async function renamePatientFolder(
  storeId: string,
  patientId: string,
  folderId: string,
  name: string,
): Promise<void> {
  await clinicaFetch<FolderEnvelope>(
    storeId,
    `/v1/patients/${patientId}/folders/${folderId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  );
}

export async function renamePatientFile(
  storeId: string,
  patientId: string,
  fileId: string,
  name: string,
): Promise<void> {
  await clinicaFetch<FileEnvelope>(
    storeId,
    `/v1/patients/${patientId}/files/${fileId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  );
}

export async function deletePatientFolder(
  storeId: string,
  patientId: string,
  folderId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/folders/${folderId}`,
    { method: 'DELETE' },
  );
}

export async function deletePatientFile(
  storeId: string,
  patientId: string,
  fileId: string,
): Promise<void> {
  await clinicaFetch<void>(
    storeId,
    `/v1/patients/${patientId}/files/${fileId}`,
    { method: 'DELETE' },
  );
}

export async function movePatientFolder(
  storeId: string,
  patientId: string,
  folderId: string,
  targetParentId: string | null,
): Promise<void> {
  await clinicaFetch<FolderEnvelope>(
    storeId,
    `/v1/patients/${patientId}/folders/${folderId}/move`,
    {
      method: 'PATCH',
      body: JSON.stringify({ parentId: targetParentId }),
    },
  );
}

export async function movePatientFile(
  storeId: string,
  patientId: string,
  fileId: string,
  targetFolderId: string | null,
): Promise<void> {
  await clinicaFetch<FileEnvelope>(
    storeId,
    `/v1/patients/${patientId}/files/${fileId}/move`,
    {
      method: 'PATCH',
      body: JSON.stringify({ folderId: targetFolderId }),
    },
  );
}

export async function getPatientMoveDestinations(
  storeId: string,
  patientId: string,
  excludeFolderSubtreeId?: string | null,
): Promise<PatientDriveMoveDestination[]> {
  const res = await clinicaFetch<MoveDestinationsEnvelope>(
    storeId,
    `/v1/patients/${patientId}/drive/move-destinations${buildMoveDestinationsQuery(excludeFolderSubtreeId)}`,
  );

  return res.data.map((destination) => ({
    id: destination.id,
    label: destination.label,
  }));
}

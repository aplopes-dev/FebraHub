import type { PatientFileKind } from './patient-file';

export type PatientFolderApiItem = {
  id: string;
  patientId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
};

export type PatientFileApiItem = {
  id: string;
  patientId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: PatientFileKind;
  previewUrl?: string;
  createdAt: string;
};

export type PatientDriveListParams = {
  folderId?: string | null;
  search?: string;
};

export type PatientDriveBreadcrumbApiItem = {
  id: string | null;
  name: string;
};

export type PatientDriveMoveDestinationApiItem = {
  id: string | null;
  label: string;
};

import type { PatientFile } from '../../domain/entities/patient-file.entity';
import type { PatientFolder } from '../../domain/entities/patient-folder.entity';

export type PatientDriveListDto = {
  storeId: string;
  patientId: string;
  folderId?: string | null;
  search?: string;
};

export type PatientDriveListResult = {
  folders: PatientFolder[];
  files: PatientFile[];
};

export type PatientDriveBreadcrumbDto = {
  storeId: string;
  patientId: string;
  folderId?: string | null;
};

export type PatientDriveBreadcrumbSegment = {
  id: string | null;
  name: string;
};

export type PatientMoveDestinationsDto = {
  storeId: string;
  patientId: string;
  excludeFolderIds?: string[];
  excludeFolderSubtreeId?: string;
};

export type PatientMoveDestination = {
  id: string | null;
  label: string;
};

export type CreatePatientFolderDto = {
  storeId: string;
  patientId: string;
  parentId: string | null;
  name: string;
};

export type RenamePatientFolderDto = {
  storeId: string;
  patientId: string;
  folderId: string;
  name: string;
};

export type MovePatientFolderDto = {
  storeId: string;
  patientId: string;
  folderId: string;
  parentId: string | null;
};

export type DeletePatientFolderDto = {
  storeId: string;
  patientId: string;
  folderId: string;
};

export type UploadPatientFileDto = {
  storeId: string;
  patientId: string;
  folderId: string | null;
  name: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type GetPatientFileContentDto = {
  storeId: string;
  patientId: string;
  fileId: string;
};

export type PatientFileContentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export type RenamePatientFileDto = {
  storeId: string;
  patientId: string;
  fileId: string;
  name: string;
};

export type MovePatientFileDto = {
  storeId: string;
  patientId: string;
  fileId: string;
  folderId: string | null;
};

export type DeletePatientFileDto = {
  storeId: string;
  patientId: string;
  fileId: string;
};
